import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { buildAdaptiveLearningSnapshot, calculateMasteryStatus, type AdaptiveLearningSnapshot, type MasteryStatus } from "./adaptive-learning";
import { prisma } from "./db";
import type { DiagnosticRecord } from "./diagnostic-store";
import { isPostgresEnabled } from "./persistence-provider";

export type AdaptiveLearningRecord = {
  id: string;
  userId?: string;
  snapshot: AdaptiveLearningSnapshot;
  createdAt: string;
  updatedAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "adaptive-learning.json");

export async function getAdaptiveLearningForChild(input: {
  userId?: string;
  childId: string;
  childName: string;
  enrolledGrade: string;
  diagnostic?: DiagnosticRecord | null;
}): Promise<AdaptiveLearningSnapshot> {
  const snapshot = buildAdaptiveLearningSnapshot(input);

  if (isPostgresEnabled()) {
    const [masteryRows, examPlan] = await Promise.all([
      prisma.topicMastery.findMany({
        where: { childId: input.childId },
        orderBy: [{ masteryScore: "asc" }, { updatedAt: "desc" }],
        take: 12,
      }),
      prisma.examReadinessPlan.findFirst({
        where: { childId: input.childId, status: "active" },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    if (masteryRows.length) {
      snapshot.masteryMap = masteryRows.map((row) => ({
        subject: row.subject,
        topic: row.topic,
        status: toMasteryStatus(row.status),
        masteryScore: Math.round(row.masteryScore),
        nextAction: row.nextAction || "Continue adaptive practice.",
      }));
    }

    if (examPlan) {
      snapshot.examReadiness = {
        ...snapshot.examReadiness,
        targetScore: examPlan.targetScore,
        examDate: (examPlan.examDate || new Date(snapshot.examReadiness.examDate)).toISOString(),
        currentReadinessPercentage: Math.round(examPlan.currentReadinessPercentage),
        predictedScore: Math.round(examPlan.predictedScore),
        topicsBlockingTarget: toStringArray(examPlan.topicsBlockingTarget),
        dailyStudyPlan: toStringArray(examPlan.dailyStudyPlan),
        weeklyRevisionPlan: toStringArray(examPlan.weeklyRevisionPlan),
        mockTestSchedule: toStringArray(examPlan.mockTestSchedule),
      };
    }

    return snapshot;
  }

  const stored = await readJsonStore();
  return stored.find((record) => record.snapshot.childId === input.childId)?.snapshot || snapshot;
}

export async function syncAdaptiveLearningForDiagnostic(input: {
  userId?: string;
  childId: string;
  childName: string;
  enrolledGrade: string;
  diagnostic: DiagnosticRecord;
  targetScore?: number;
  dailyAvailableMinutes?: number;
  examDate?: Date;
}): Promise<AdaptiveLearningSnapshot> {
  const snapshot = buildAdaptiveLearningSnapshot(input);

  if (isPostgresEnabled()) {
    await persistSnapshot(input.userId, snapshot);
    return snapshot;
  }

  const now = new Date().toISOString();
  const existing = (await readJsonStore()).filter((record) => record.snapshot.childId !== input.childId);
  await writeJsonStore([
    {
      id: randomUUID(),
      userId: input.userId,
      snapshot,
      createdAt: now,
      updatedAt: now,
    },
    ...existing,
  ]);
  return snapshot;
}

export async function recordPracticeAttemptAndUpdateMastery(input: {
  userId?: string;
  childId: string;
  subject: string;
  chapter?: string;
  topic: string;
  attemptType: "diagnostic" | "precheck" | "quiz" | "practice" | "revision" | "mock-test" | "chapter-exam";
  score: number;
  total: number;
  percentage?: number;
  timeSpentMinutes?: number;
  retryCount?: number;
  mistakes?: string[];
}) {
  const percentage = input.percentage ?? (input.total ? Math.round((input.score / input.total) * 1000) / 10 : 0);
  const chapter = input.chapter || "Adaptive Practice";
  const mistakes = input.mistakes || [];
  const previous = isPostgresEnabled()
    ? await prisma.topicMastery.findUnique({
        where: { childId_subject_chapter_topic: { childId: input.childId, subject: input.subject, chapter, topic: input.topic } },
      })
    : undefined;
  const retryCount = (previous?.retryCount || 0) + (input.retryCount ?? (percentage < 70 ? 1 : 0));
  const timeSpentMinutes = (previous?.timeSpentMinutes || 0) + (input.timeSpentMinutes || 0);
  const revisionScore = input.attemptType === "revision" ? percentage : previous?.revisionScore ?? undefined;
  const mockTestScore = input.attemptType === "mock-test" || input.attemptType === "chapter-exam" ? percentage : previous?.mockTestScore ?? undefined;
  const mastery = calculateMasteryStatus({
    diagnosticScore: previous?.diagnosticScore ?? undefined,
    quizScore: percentage,
    retryCount,
    timeSpentMinutes,
    repeatedMistakes: mistakes.length,
    revisionScore,
    mockTestScore,
  });

  if (isPostgresEnabled()) {
    const [attempt, topicMastery] = await Promise.all([
      prisma.practiceAttempt.create({
        data: {
          userId: input.userId,
          childId: input.childId,
          subject: input.subject,
          chapter,
          topic: input.topic,
          attemptType: input.attemptType,
          score: input.score,
          total: input.total,
          percentage,
          timeSpentMinutes: input.timeSpentMinutes || 0,
          retryCount,
          mistakes,
          actionTaken: mastery.nextAction,
        },
      }),
      prisma.topicMastery.upsert({
        where: { childId_subject_chapter_topic: { childId: input.childId, subject: input.subject, chapter, topic: input.topic } },
        create: {
          userId: input.userId,
          childId: input.childId,
          subject: input.subject,
          chapter,
          topic: input.topic,
          status: mastery.status,
          quizScore: percentage,
          retryCount,
          timeSpentMinutes,
          mistakesRepeated: mistakes,
          revisionScore,
          mockTestScore,
          masteryScore: mastery.masteryScore,
          nextAction: mastery.nextAction,
          prerequisiteTopic: mistakes[0],
          lastPracticedAt: new Date(),
          examReadyAt: mastery.status === "Exam-ready" ? new Date() : null,
        },
        update: {
          userId: input.userId ?? previous?.userId,
          status: mastery.status,
          quizScore: percentage,
          retryCount,
          timeSpentMinutes,
          mistakesRepeated: mistakes,
          revisionScore,
          mockTestScore,
          masteryScore: mastery.masteryScore,
          nextAction: mastery.nextAction,
          prerequisiteTopic: mistakes[0] || previous?.prerequisiteTopic,
          lastPracticedAt: new Date(),
          examReadyAt: mastery.status === "Exam-ready" ? new Date() : previous?.examReadyAt,
        },
      }),
    ]);
    return { attempt, mastery: topicMastery };
  }

  return { attempt: undefined, mastery };
}

async function persistSnapshot(userId: string | undefined, snapshot: AdaptiveLearningSnapshot) {
  const existingPath = await prisma.learningPath.findFirst({
    where: { childId: snapshot.childId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
  const pathData = {
    userId,
    childId: snapshot.childId,
    enrolledGrade: snapshot.enrolledGrade,
    actualLearningLevel: snapshot.actualLearningLevel,
    currentPhase: snapshot.currentPhase,
    recommendedStartingPoint: snapshot.recommendedStartingPoint,
    gradeReadinessPercentage: snapshot.gradeReadinessPercentage,
    foundationRecoveryRequired: snapshot.foundationRecoveryRequired,
    targetScore: snapshot.examReadiness.targetScore,
    dailyAvailableMinutes: sumMinutes(snapshot.todayPlan),
    status: "active",
    foundationTopics: snapshot.foundationTopics,
    bridgeTopics: snapshot.bridgeTopics,
    classSyllabusTopics: snapshot.classSyllabusTopics,
    revisionTopics: snapshot.revisionTopics,
    mockTestSchedule: snapshot.mockTestSchedule,
    weakTopicRepairLoop: snapshot.weakTopicRepairLoop,
    todayPlan: snapshot.todayPlan,
    weeklyPlan: snapshot.weeklyRevisionPlan,
    metadata: {
      weakAreas: snapshot.weakAreas,
      strongAreas: snapshot.strongAreas,
      learningSpeed: snapshot.learningSpeed,
      parentAction: snapshot.parentAction,
      studentAction: snapshot.studentAction,
    },
  };

  if (existingPath) {
    await prisma.learningPath.update({ where: { id: existingPath.id }, data: pathData });
  } else {
    await prisma.learningPath.create({ data: pathData });
  }

  const existingExamPlan = await prisma.examReadinessPlan.findFirst({
    where: { childId: snapshot.childId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
  const examData = {
    userId,
    childId: snapshot.childId,
    examName: "Annual Exam",
    targetScore: snapshot.examReadiness.targetScore,
    examDate: new Date(snapshot.examReadiness.examDate),
    currentReadinessPercentage: snapshot.examReadiness.currentReadinessPercentage,
    predictedScore: snapshot.examReadiness.predictedScore,
    dailyAvailableMinutes: sumMinutes(snapshot.todayPlan),
    syllabusSize: snapshot.classSyllabusTopics.length + snapshot.foundationTopics.length + snapshot.bridgeTopics.length,
    weakTopics: snapshot.weakAreas,
    topicsBlockingTarget: snapshot.examReadiness.topicsBlockingTarget,
    dailyStudyPlan: snapshot.examReadiness.dailyStudyPlan,
    weeklyRevisionPlan: snapshot.examReadiness.weeklyRevisionPlan,
    mockTestSchedule: snapshot.examReadiness.mockTestSchedule,
    readinessBySubject: readinessBySubject(snapshot),
    status: "active",
  };

  if (existingExamPlan) {
    await prisma.examReadinessPlan.update({ where: { id: existingExamPlan.id }, data: examData });
  } else {
    await prisma.examReadinessPlan.create({ data: examData });
  }

  await Promise.all(
    snapshot.masteryMap.map((item) =>
      prisma.topicMastery.upsert({
        where: { childId_subject_chapter_topic: { childId: snapshot.childId, subject: item.subject, chapter: "Adaptive Path", topic: item.topic } },
        create: {
          userId,
          childId: snapshot.childId,
          subject: item.subject,
          chapter: "Adaptive Path",
          topic: item.topic,
          status: item.status,
          diagnosticScore: snapshot.gradeReadinessPercentage,
          masteryScore: item.masteryScore,
          nextAction: item.nextAction,
          prerequisiteTopic: snapshot.foundationTopics[0],
        },
        update: {
          userId,
          status: item.status,
          diagnosticScore: snapshot.gradeReadinessPercentage,
          masteryScore: item.masteryScore,
          nextAction: item.nextAction,
          prerequisiteTopic: snapshot.foundationTopics[0],
        },
      }),
    ),
  );
}

async function readJsonStore(): Promise<AdaptiveLearningRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as AdaptiveLearningRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: AdaptiveLearningRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function readinessBySubject(snapshot: AdaptiveLearningSnapshot) {
  const subjects = new Map<string, { total: number; count: number }>();
  snapshot.masteryMap.forEach((item) => {
    const current = subjects.get(item.subject) || { total: 0, count: 0 };
    subjects.set(item.subject, { total: current.total + item.masteryScore, count: current.count + 1 });
  });
  return Object.fromEntries(Array.from(subjects.entries()).map(([subject, value]) => [subject, Math.round(value.total / Math.max(1, value.count))]));
}

function sumMinutes(plan: AdaptiveLearningSnapshot["todayPlan"]) {
  return plan.reduce((total, task) => total + task.minutes, 0);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toMasteryStatus(value: string): MasteryStatus {
  const allowed: MasteryStatus[] = ["Not started", "Learning", "Needs practice", "Weak", "Improving", "Mastered", "Exam-ready"];
  return allowed.includes(value as MasteryStatus) ? (value as MasteryStatus) : "Not started";
}
