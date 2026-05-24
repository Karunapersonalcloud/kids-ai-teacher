import { cookies } from "next/headers";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import { createExamPlan, listExamPlansForChild } from "@/lib/exam-plan-store";
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
  if (!isPostgresEnabled()) return { id: childId, userId };
  return prisma.child.findFirst({ where: { id: childId, userId }, select: { id: true, userId: true } });
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  if (!childId) return Response.json({ error: "childId is required." }, { status: 400 });
  const child = await getOwnedChild(user.id, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });
  return Response.json({ plans: await listExamPlansForChild(childId) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });
  const body = (await request.json()) as {
    childId?: string;
    examName?: string;
    examDate?: string;
    subjects?: string;
    chapters?: string;
    weightage?: string;
  };
  if (!body.childId || !body.examName) return Response.json({ error: "childId and examName are required." }, { status: 400 });
  const child = await getOwnedChild(user.id, body.childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const plan = await createExamPlan({
    userId: user.id,
    childId: body.childId,
    examName: body.examName,
    examDate: body.examDate,
    subjects: splitLines(body.subjects || ""),
    chapters: splitLines(body.chapters || ""),
    weightage: body.weightage,
  });

  return Response.json({ plan });
}

function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
