import { unique, updateProgress } from "@/lib/progress-store";
import { recordPracticeAttemptAndUpdateMastery } from "@/lib/adaptive-learning-store";
import { prisma } from "@/lib/db";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import type { ChildId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: ChildId; subject?: string; score?: number; total?: number; weakConcepts?: string[] };
  if (!body.childId) return Response.json({ error: "childId is required." }, { status: 400 });
  const score = Number(body.score || 0);
  const total = Number(body.total || 0);
  const weakConcepts = body.weakConcepts || [];
  if (isPostgresEnabled()) {
    await prisma.quizResult.create({
      data: {
        childId: body.childId,
        subject: body.subject || "General",
        score,
        total,
        percentage: total ? (score / total) * 100 : 0,
        weakConcepts,
      },
    });
  }
  const progress = await updateProgress(body.childId, (record) => ({
    ...record,
    quizzesAttempted: record.quizzesAttempted + 1,
    quizScoreHistory: [
      ...record.quizScoreHistory,
      { subject: body.subject || "General", score, total, date: new Date().toISOString(), weakConcepts },
    ],
    weakConcepts: unique([...record.weakConcepts, ...weakConcepts]),
    starsEarned: record.starsEarned + Math.max(1, score * 2),
  }));
  await recordPracticeAttemptAndUpdateMastery({
    childId: body.childId,
    subject: body.subject || "General",
    topic: weakConcepts[0] || "Mixed quiz",
    attemptType: "quiz",
    score,
    total,
    percentage: total ? (score / total) * 100 : 0,
    timeSpentMinutes: 10,
    mistakes: weakConcepts,
  });
  return Response.json({ progress });
}
