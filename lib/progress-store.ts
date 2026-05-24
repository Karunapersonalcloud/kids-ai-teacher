import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
import { children } from "./mock-data";
import type { ChildId, ProgressRecord } from "./types";

const progressPath = path.join(process.cwd(), "storage", "progress.json");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultProgress(childId: ChildId): ProgressRecord {
  return {
    childId,
    lessonsCompleted: [],
    topicsRevised: [],
    quizzesAttempted: 0,
    quizScoreHistory: [],
    weakConcepts: [],
    starsEarned: 0,
    streakCount: 0,
    lastActiveDate: "",
  };
}

async function ensureProgressStorage() {
  await fs.mkdir(path.dirname(progressPath), { recursive: true });
}

export async function readProgressRecords(): Promise<ProgressRecord[]> {
  if (isPostgresEnabled()) {
    const rows = await prisma.progress.findMany();
    return children.map((child) => {
      const childRows = rows.filter((row) => row.childId === child.id);
      if (!childRows.length) return defaultProgress(child.id);
      const summary = childRows.find((row) => row.subject === "Overall") || childRows[0];
      const weakConcepts = Array.isArray(summary.weakConcepts) ? summary.weakConcepts.map(String) : [];
      return {
        childId: child.id,
        lessonsCompleted: Array.from({ length: summary.lessonsCompleted }, (_, index) => `Lesson ${index + 1}`),
        topicsRevised: Array.from({ length: summary.topicsRevised }, (_, index) => `Topic ${index + 1}`),
        quizzesAttempted: summary.quizzesAttempted,
        quizScoreHistory: [],
        weakConcepts,
        starsEarned: summary.starsEarned,
        streakCount: summary.streakCount,
        lastActiveDate: summary.lastActiveDate?.toISOString().slice(0, 10) || "",
      };
    });
  }

  try {
    await ensureProgressStorage();
    const raw = await fs.readFile(progressPath, "utf8");
    const parsed = JSON.parse(raw) as ProgressRecord[];
    return children.map((child) => parsed.find((item) => item.childId === child.id) || defaultProgress(child.id));
  } catch {
    return children.map((child) => defaultProgress(child.id));
  }
}

export async function writeProgressRecords(records: ProgressRecord[]) {
  if (isPostgresEnabled()) {
    await Promise.all(records.map((record) => writePostgresProgress(record)));
    return;
  }

  await ensureProgressStorage();
  await fs.writeFile(progressPath, JSON.stringify(records, null, 2), "utf8");
}

export async function getProgress(childId: ChildId) {
  const records = await readProgressRecords();
  return records.find((item) => item.childId === childId) || defaultProgress(childId);
}

export async function updateProgress(childId: ChildId, updater: (record: ProgressRecord) => ProgressRecord) {
  if (isPostgresEnabled()) {
    const current = await getProgress(childId);
    const next = touchProgress(updater(current));
    await writePostgresProgress(next);
    return next;
  }

  const records = await readProgressRecords();
  const nextRecords = records.map((record) => (record.childId === childId ? touchProgress(updater(record)) : record));
  await writeProgressRecords(nextRecords);
  return nextRecords.find((record) => record.childId === childId) || defaultProgress(childId);
}

function touchProgress(record: ProgressRecord) {
  const current = today();
  const streakCount = record.lastActiveDate && record.lastActiveDate !== current ? Math.max(record.streakCount, 1) + 1 : Math.max(record.streakCount, 1);
  return { ...record, lastActiveDate: current, streakCount };
}

export function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function writePostgresProgress(record: ProgressRecord) {
  const existing = await prisma.progress.findFirst({ where: { userId: null, childId: record.childId, subject: "Overall" } });
  const data = {
    childId: record.childId,
    subject: "Overall",
    lessonsCompleted: record.lessonsCompleted.length,
    topicsRevised: record.topicsRevised.length,
    quizzesAttempted: record.quizzesAttempted,
    starsEarned: record.starsEarned,
    streakCount: record.streakCount,
    lastActiveDate: record.lastActiveDate ? new Date(record.lastActiveDate) : null,
    weakConcepts: record.weakConcepts,
  };

  if (existing) {
    await prisma.progress.update({ where: { id: existing.id }, data });
  } else {
    await prisma.progress.create({ data });
  }
}
