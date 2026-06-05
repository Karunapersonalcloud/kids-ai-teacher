import { cookies } from "next/headers";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import { getDiagnosticPackForGrade, scoreDiagnostic, type DiagnosticAnswer } from "@/lib/diagnostic-catalog";
import { getLatestDiagnosticForChild, saveDiagnosticResult } from "@/lib/diagnostic-store";
import { syncAdaptiveLearningForDiagnostic } from "@/lib/adaptive-learning-store";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const runtime = "nodejs";

async function getSessionUser() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);
  if (!userId) return undefined;
  return findAccessById(userId);
}

async function getOwnedChild(userId: string, childId: string) {
  if (!isPostgresEnabled()) {
    return { id: childId, name: "Demo Child", grade: "Class 9", userId };
  }
  const child = await prisma.child.findFirst({ where: { id: childId, userId } });
  return child || undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  if (!childId) return Response.json({ error: "childId is required." }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });
  const parentUserId = user.userId || user.id;

  const child = await getOwnedChild(parentUserId, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const pack = getDiagnosticPackForGrade(child.grade);
  const latest = await getLatestDiagnosticForChild(childId);
  // Hide correct answers when returning the question pack.
  return Response.json({
    child: { id: child.id, name: child.name, grade: child.grade },
    pack: {
      title: pack.title,
      grade: pack.grade,
      questions: pack.questions.map(({ id, area, subject, prompt, choices }) => ({ id, area, subject, prompt, choices })),
    },
    latestResult: latest,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: string; answers?: DiagnosticAnswer[] };
  const childId = body.childId;
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!childId) return Response.json({ error: "childId is required." }, { status: 400 });
  if (!answers.length) return Response.json({ error: "answers are required." }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });
  const parentUserId = user.userId || user.id;

  const child = await getOwnedChild(parentUserId, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const pack = getDiagnosticPackForGrade(child.grade);
  const score = scoreDiagnostic(pack, answers);
  const result = await saveDiagnosticResult({
    userId: parentUserId,
    childId,
    grade: child.grade,
    subject: "Overall",
    answers,
    score,
  });
  const adaptivePlan = await syncAdaptiveLearningForDiagnostic({
    userId: parentUserId,
    childId,
    childName: child.name,
    enrolledGrade: child.grade,
    diagnostic: result,
  });

  return Response.json({ result, adaptivePlan });
}
