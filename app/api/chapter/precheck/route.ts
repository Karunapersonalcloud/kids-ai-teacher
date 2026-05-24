import { cookies } from "next/headers";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import {
  type ChapterAnswer,
  getChapterPack,
  publicPack,
  scorePrecheck,
} from "@/lib/chapter-catalog";
import { upsertChapterMastery } from "@/lib/chapter-mastery-store";
import { getLatestReadiness, saveChapterReadiness } from "@/lib/chapter-readiness-store";
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
    return { id: childId, name: "Demo Child", grade: "Class 6", userId };
  }
  const child = await prisma.child.findFirst({ where: { id: childId, userId } });
  return child || undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  const chapterId = url.searchParams.get("chapterId");
  if (!childId || !chapterId) return Response.json({ error: "childId and chapterId required." }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });

  const child = await getOwnedChild(user.id, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const pack = getChapterPack(chapterId);
  if (!pack) return Response.json({ error: "Chapter not found." }, { status: 404 });

  const latest = await getLatestReadiness(childId, pack.chapter);
  return Response.json({
    child: { id: child.id, name: child.name, grade: child.grade },
    pack: publicPack(pack, "precheck"),
    latestResult: latest,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: string; chapterId?: string; answers?: ChapterAnswer[] };
  if (!body.childId || !body.chapterId) return Response.json({ error: "childId and chapterId required." }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });

  const child = await getOwnedChild(user.id, body.childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const pack = getChapterPack(body.chapterId);
  if (!pack) return Response.json({ error: "Chapter not found." }, { status: 404 });

  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!answers.length) return Response.json({ error: "answers required." }, { status: 400 });

  const score = scorePrecheck(pack, answers);
  const result = await saveChapterReadiness({
    userId: user.id,
    childId: body.childId,
    subject: pack.subject,
    chapter: pack.chapter,
    answers,
    score,
  });

  // Move chapter from locked → learning if ready; otherwise stay locked but record weak prerequisites.
  await upsertChapterMastery({
    userId: user.id,
    childId: body.childId,
    subject: pack.subject,
    chapter: pack.chapter,
    status: score.status === "ready" ? "learning" : "locked",
    weakConcepts: score.weakPrerequisites,
  });

  return Response.json({ result });
}
