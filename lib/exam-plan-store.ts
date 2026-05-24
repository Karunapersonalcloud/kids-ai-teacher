import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";

export type ExamPlanRecord = {
  id: string;
  userId?: string;
  childId: string;
  examName: string;
  examDate?: string;
  subjects: string[];
  chapters: string[];
  weightage?: string;
  portionImageUrl?: string;
  readinessScore?: number;
  dailyPlan: { day: number; focus: string; task: string }[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "exam-plans.json");

export async function listExamPlansForChild(childId: string): Promise<ExamPlanRecord[]> {
  if (isPostgresEnabled()) {
    const rows = await prisma.examPlan.findMany({ where: { childId }, orderBy: { createdAt: "desc" } });
    return rows.map(rowToRecord);
  }
  const all = await readJsonStore();
  return all.filter((item) => item.childId === childId);
}

export async function createExamPlan(input: {
  userId?: string;
  childId: string;
  examName: string;
  examDate?: string;
  subjects: string[];
  chapters: string[];
  weightage?: string;
}): Promise<ExamPlanRecord> {
  const dailyPlan = buildExamDailyPlan(input.chapters);
  const readinessScore = input.chapters.length ? 40 : 20;
  const now = new Date();
  const examDate = input.examDate ? new Date(input.examDate) : undefined;

  if (isPostgresEnabled()) {
    const created = await prisma.examPlan.create({
      data: {
        userId: input.userId,
        childId: input.childId,
        examName: input.examName,
        examDate,
        subjects: input.subjects,
        chapters: input.chapters,
        weightage: input.weightage ? { note: input.weightage } : undefined,
        readinessScore,
        dailyPlan,
        status: "active",
      },
    });
    return rowToRecord(created);
  }

  const record: ExamPlanRecord = {
    id: randomUUID(),
    userId: input.userId,
    childId: input.childId,
    examName: input.examName,
    examDate: examDate?.toISOString(),
    subjects: input.subjects,
    chapters: input.chapters,
    weightage: input.weightage,
    readinessScore,
    dailyPlan,
    status: "active",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readJsonStore();
  await writeJsonStore([record, ...all]);
  return record;
}

function buildExamDailyPlan(chapters: string[]) {
  const uniqueChapters = chapters.length ? chapters : ["Teacher-given portion"];
  const days = Math.min(7, Math.max(3, uniqueChapters.length + 2));
  return Array.from({ length: days }, (_, index) => {
    const chapter = uniqueChapters[index % uniqueChapters.length];
    const isLast = index === days - 1;
    return {
      day: index + 1,
      focus: isLast ? "Mock test and weak-area retest" : chapter,
      task: isLast
        ? "Take one mock test, review mistakes, and revise only weak concepts."
        : `Revise ${chapter}, solve practice questions, and mark weak concepts.`,
    };
  });
}

async function readJsonStore(): Promise<ExamPlanRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as ExamPlanRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: ExamPlanRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function rowToRecord(row: {
  id: string;
  userId: string | null;
  childId: string;
  examName: string;
  examDate: Date | null;
  subjects: unknown;
  chapters: unknown;
  weightage: unknown;
  portionImageUrl: string | null;
  readinessScore: number | null;
  dailyPlan: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ExamPlanRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    childId: row.childId,
    examName: row.examName,
    examDate: row.examDate?.toISOString(),
    subjects: toStringArray(row.subjects),
    chapters: toStringArray(row.chapters),
    weightage: typeof row.weightage === "object" && row.weightage ? String((row.weightage as { note?: unknown }).note || "") : undefined,
    portionImageUrl: row.portionImageUrl || undefined,
    readinessScore: row.readinessScore ?? undefined,
    dailyPlan: Array.isArray(row.dailyPlan) ? (row.dailyPlan as ExamPlanRecord["dailyPlan"]) : [],
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
