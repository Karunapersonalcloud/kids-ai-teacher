import { cookies } from "next/headers";
import { findAccessById } from "@/lib/access-store";
import { createBacklogPlan } from "@/lib/backlog-store";
import { prisma } from "@/lib/db";
import { recordPracticeAttemptAndUpdateMastery } from "@/lib/adaptive-learning-store";
import {
  type ChapterAnswer,
  MASTERY_PASS_PERCENT,
  getChapterPack,
  publicPack,
  scoreExam,
} from "@/lib/chapter-catalog";
import { getChapterMastery, upsertChapterMastery } from "@/lib/chapter-mastery-store";
import { getLatestReadiness } from "@/lib/chapter-readiness-store";
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
  const parentUserId = user.userId || user.id;

  const child = await getOwnedChild(parentUserId, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const pack = getChapterPack(chapterId);
  if (!pack) return Response.json({ error: "Chapter not found." }, { status: 404 });

  // Gate: the child must have passed the pre-check before attempting the chapter exam.
  const readiness = await getLatestReadiness(childId, pack.chapter);
  if (!readiness || readiness.readinessStatus !== "ready") {
    return Response.json(
      { error: "Pre-check not passed. Please complete prerequisite lessons and re-take the pre-check." },
      { status: 403 },
    );
  }

  const mastery = await getChapterMastery(childId, pack.subject, pack.chapter);
  return Response.json({
    child: { id: child.id, name: child.name, grade: child.grade },
    pack: publicPack(pack, "exam"),
    mastery,
    passMark: MASTERY_PASS_PERCENT,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: string; chapterId?: string; answers?: ChapterAnswer[] };
  if (!body.childId || !body.chapterId) return Response.json({ error: "childId and chapterId required." }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });
  const parentUserId = user.userId || user.id;

  const child = await getOwnedChild(parentUserId, body.childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const pack = getChapterPack(body.chapterId);
  if (!pack) return Response.json({ error: "Chapter not found." }, { status: 404 });

  const readiness = await getLatestReadiness(body.childId, pack.chapter);
  if (!readiness || readiness.readinessStatus !== "ready") {
    return Response.json({ error: "Pre-check not passed." }, { status: 403 });
  }

  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!answers.length) return Response.json({ error: "answers required." }, { status: 400 });

  const score = scoreExam(pack, answers);
  const status = score.mastered ? "mastered" : score.percentage >= 60 ? "revision" : "learning";

  const mastery = await upsertChapterMastery({
    userId: parentUserId,
    childId: body.childId,
    subject: pack.subject,
    chapter: pack.chapter,
    status,
    masteryScore: score.percentage,
    weakConcepts: score.weakConcepts,
    attemptIncrement: true,
    markMastered: score.mastered,
  });

  let backlogPlan = undefined;
  if (!score.mastered && score.weakConcepts.length) {
    backlogPlan = await createBacklogPlan({
      userId: parentUserId,
      childId: body.childId,
      subject: pack.subject,
      chapter: pack.chapter,
      weakConcepts: score.weakConcepts,
    });
  }
  await recordPracticeAttemptAndUpdateMastery({
    userId: parentUserId,
    childId: body.childId,
    subject: pack.subject,
    chapter: pack.chapter,
    topic: score.weakConcepts[0] || pack.chapter,
    attemptType: "chapter-exam",
    score: score.score,
    total: score.total,
    percentage: score.percentage,
    timeSpentMinutes: 20,
    mistakes: score.weakConcepts,
  });

  return Response.json({ score, mastery, backlogPlan, passMark: MASTERY_PASS_PERCENT });
}
