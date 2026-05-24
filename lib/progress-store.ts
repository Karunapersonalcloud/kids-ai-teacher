import { promises as fs } from "fs";
import path from "path";
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
  await ensureProgressStorage();
  await fs.writeFile(progressPath, JSON.stringify(records, null, 2), "utf8");
}

export async function getProgress(childId: ChildId) {
  const records = await readProgressRecords();
  return records.find((item) => item.childId === childId) || defaultProgress(childId);
}

export async function updateProgress(childId: ChildId, updater: (record: ProgressRecord) => ProgressRecord) {
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
