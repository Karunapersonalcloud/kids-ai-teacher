import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
import type { ChapterAnswer, PrecheckScore } from "./chapter-catalog";

export type ChapterReadinessRecord = {
  id: string;
  userId?: string;
  childId: string;
  subject: string;
  chapter: string;
  readinessStatus: "ready" | "needs-prerequisites";
  score: number;
  total: number;
  percentage: number;
  weakPrerequisites: string[];
  recommendedPrerequisiteLessons: { concept: string; summary: string }[];
  answers: ChapterAnswer[];
  createdAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "chapter-readiness.json");

export async function saveChapterReadiness(input: {
  userId?: string;
  childId: string;
  subject: string;
  chapter: string;
  answers: ChapterAnswer[];
  score: PrecheckScore;
}): Promise<ChapterReadinessRecord> {
  const now = new Date();
  if (isPostgresEnabled()) {
    const created = await prisma.chapterReadinessResult.create({
      data: {
        userId: input.userId,
        childId: input.childId,
        subject: input.subject,
        chapter: input.chapter,
        readinessStatus: input.score.status,
        score: input.score.score,
        total: input.score.total,
        percentage: input.score.percentage,
        weakPrerequisites: input.score.weakPrerequisites,
        recommendedPrerequisiteLessons: input.score.recommendedPrerequisiteLessons,
        answers: input.answers,
      },
    });
    return rowToRecord(created);
  }

  const record: ChapterReadinessRecord = {
    id: randomUUID(),
    userId: input.userId,
    childId: input.childId,
    subject: input.subject,
    chapter: input.chapter,
    readinessStatus: input.score.status,
    score: input.score.score,
    total: input.score.total,
    percentage: input.score.percentage,
    weakPrerequisites: input.score.weakPrerequisites,
    recommendedPrerequisiteLessons: input.score.recommendedPrerequisiteLessons,
    answers: input.answers,
    createdAt: now.toISOString(),
  };
  const all = await readJsonStore();
  await writeJsonStore([record, ...all]);
  return record;
}

export async function getLatestReadiness(childId: string, chapter: string): Promise<ChapterReadinessRecord | undefined> {
  if (isPostgresEnabled()) {
    const row = await prisma.chapterReadinessResult.findFirst({
      where: { childId, chapter },
      orderBy: { createdAt: "desc" },
    });
    return row ? rowToRecord(row) : undefined;
  }
  const all = await readJsonStore();
  return all.find((item) => item.childId === childId && item.chapter === chapter);
}

async function readJsonStore(): Promise<ChapterReadinessRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as ChapterReadinessRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: ChapterReadinessRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function rowToRecord(row: {
  id: string;
  userId: string | null;
  childId: string;
  subject: string;
  chapter: string;
  readinessStatus: string;
  score: number;
  total: number;
  percentage: number;
  weakPrerequisites: unknown;
  recommendedPrerequisiteLessons: unknown;
  answers: unknown;
  createdAt: Date;
}): ChapterReadinessRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    childId: row.childId,
    subject: row.subject,
    chapter: row.chapter,
    readinessStatus: row.readinessStatus === "ready" ? "ready" : "needs-prerequisites",
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    weakPrerequisites: toStringArray(row.weakPrerequisites),
    recommendedPrerequisiteLessons: toLessonArray(row.recommendedPrerequisiteLessons),
    answers: Array.isArray(row.answers) ? (row.answers as ChapterAnswer[]) : [],
    createdAt: row.createdAt.toISOString(),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toLessonArray(value: unknown): { concept: string; summary: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { concept: string; summary: string } => typeof item === "object" && item !== null && typeof (item as { concept?: unknown }).concept === "string")
    .map((item) => ({ concept: item.concept, summary: typeof item.summary === "string" ? item.summary : "" }));
}
