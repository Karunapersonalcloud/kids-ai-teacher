import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";

export type ChapterStatus = "locked" | "learning" | "revision" | "mastered";

export type ChapterMasteryRecord = {
  id: string;
  userId?: string;
  childId: string;
  subject: string;
  chapter: string;
  masteryScore: number;
  status: ChapterStatus;
  attempts: number;
  weakConcepts: string[];
  lastAttemptAt?: string;
  masteredAt?: string;
  createdAt: string;
  updatedAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "chapter-mastery.json");

export async function getChapterMastery(childId: string, subject: string, chapter: string): Promise<ChapterMasteryRecord | undefined> {
  if (isPostgresEnabled()) {
    const row = await prisma.chapterMastery.findUnique({ where: { childId_subject_chapter: { childId, subject, chapter } } });
    return row ? rowToRecord(row) : undefined;
  }
  const all = await readJsonStore();
  return all.find((m) => m.childId === childId && m.subject === subject && m.chapter === chapter);
}

export async function listChapterMasteryForChild(childId: string): Promise<ChapterMasteryRecord[]> {
  if (isPostgresEnabled()) {
    const rows = await prisma.chapterMastery.findMany({ where: { childId }, orderBy: { updatedAt: "desc" } });
    return rows.map(rowToRecord);
  }
  const all = await readJsonStore();
  return all.filter((m) => m.childId === childId);
}

export async function upsertChapterMastery(input: {
  userId?: string;
  childId: string;
  subject: string;
  chapter: string;
  status: ChapterStatus;
  masteryScore?: number;
  weakConcepts?: string[];
  attemptIncrement?: boolean;
  markMastered?: boolean;
}): Promise<ChapterMasteryRecord> {
  const now = new Date();
  const existing = await getChapterMastery(input.childId, input.subject, input.chapter);
  const attempts = (existing?.attempts ?? 0) + (input.attemptIncrement ? 1 : 0);
  const masteryScore = input.masteryScore ?? existing?.masteryScore ?? 0;
  const weakConcepts = input.weakConcepts ?? existing?.weakConcepts ?? [];
  const masteredAt = input.markMastered ? now : existing?.masteredAt ? new Date(existing.masteredAt) : null;

  if (isPostgresEnabled()) {
    const row = await prisma.chapterMastery.upsert({
      where: { childId_subject_chapter: { childId: input.childId, subject: input.subject, chapter: input.chapter } },
      create: {
        userId: input.userId,
        childId: input.childId,
        subject: input.subject,
        chapter: input.chapter,
        status: input.status,
        masteryScore,
        attempts,
        weakConcepts,
        lastAttemptAt: input.attemptIncrement ? now : null,
        masteredAt: input.markMastered ? now : null,
      },
      update: {
        userId: input.userId ?? existing?.userId,
        status: input.status,
        masteryScore,
        attempts,
        weakConcepts,
        lastAttemptAt: input.attemptIncrement ? now : (existing?.lastAttemptAt ? new Date(existing.lastAttemptAt) : null),
        masteredAt,
      },
    });
    return rowToRecord(row);
  }

  const record: ChapterMasteryRecord = {
    id: existing?.id ?? randomUUID(),
    userId: input.userId ?? existing?.userId,
    childId: input.childId,
    subject: input.subject,
    chapter: input.chapter,
    status: input.status,
    masteryScore,
    attempts,
    weakConcepts,
    lastAttemptAt: input.attemptIncrement ? now.toISOString() : existing?.lastAttemptAt,
    masteredAt: input.markMastered ? now.toISOString() : existing?.masteredAt,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readJsonStore();
  const next = [record, ...all.filter((m) => m.id !== record.id)];
  await writeJsonStore(next);
  return record;
}

async function readJsonStore(): Promise<ChapterMasteryRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as ChapterMasteryRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: ChapterMasteryRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function rowToRecord(row: {
  id: string;
  userId: string | null;
  childId: string;
  subject: string;
  chapter: string;
  masteryScore: number;
  status: string;
  attempts: number;
  weakConcepts: unknown;
  lastAttemptAt: Date | null;
  masteredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ChapterMasteryRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    childId: row.childId,
    subject: row.subject,
    chapter: row.chapter,
    masteryScore: row.masteryScore,
    status: toChapterStatus(row.status),
    attempts: row.attempts,
    weakConcepts: Array.isArray(row.weakConcepts) ? row.weakConcepts.filter((s): s is string => typeof s === "string") : [],
    lastAttemptAt: row.lastAttemptAt?.toISOString(),
    masteredAt: row.masteredAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toChapterStatus(value: string): ChapterStatus {
  if (value === "learning" || value === "revision" || value === "mastered") return value;
  return "locked";
}
