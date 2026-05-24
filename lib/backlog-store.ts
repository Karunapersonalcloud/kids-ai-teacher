import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";

export type BacklogRecord = {
  id: string;
  userId?: string;
  childId: string;
  subject: string;
  chapter: string;
  weakConcepts: string[];
  dailyPlan: { day: number; focus: string; tasks: string[] }[];
  status: "active" | "completed";
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "backlog-plans.json");

export function buildDailyPlan(weakConcepts: string[]): { day: number; focus: string; tasks: string[] }[] {
  if (weakConcepts.length === 0) return [];
  const days = Math.min(5, Math.max(2, Math.ceil(weakConcepts.length / 2)));
  const buckets: string[][] = Array.from({ length: days }, () => []);
  weakConcepts.forEach((concept, index) => {
    buckets[index % days].push(concept);
  });
  return buckets.map((concepts, idx) => ({
    day: idx + 1,
    focus: concepts.join(", "),
    tasks: [
      `Watch a short video on ${concepts[0]} and take notes`,
      `Solve 5 practice problems covering ${concepts.join(" & ")}`,
      `Take the mini quiz on ${concepts[concepts.length - 1]}`,
    ],
  }));
}

export async function createBacklogPlan(input: {
  userId?: string;
  childId: string;
  subject: string;
  chapter: string;
  weakConcepts: string[];
}): Promise<BacklogRecord> {
  const dailyPlan = buildDailyPlan(input.weakConcepts);
  const now = new Date();

  if (isPostgresEnabled()) {
    const created = await prisma.backlogPlan.create({
      data: {
        userId: input.userId,
        childId: input.childId,
        subject: input.subject,
        chapter: input.chapter,
        weakConcepts: input.weakConcepts,
        dailyPlan,
        status: "active",
      },
    });
    // Also seed revision tasks for each weak concept.
    if (input.weakConcepts.length) {
      await prisma.revisionTask.createMany({
        data: input.weakConcepts.map((concept) => ({
          userId: input.userId,
          childId: input.childId,
          subject: input.subject,
          chapter: input.chapter,
          concept,
          taskType: "revision",
          status: "pending",
          metadata: { source: "chapter-exam", backlogPlanId: created.id },
        })),
      });
    }
    return rowToRecord(created);
  }

  const record: BacklogRecord = {
    id: randomUUID(),
    userId: input.userId,
    childId: input.childId,
    subject: input.subject,
    chapter: input.chapter,
    weakConcepts: input.weakConcepts,
    dailyPlan,
    status: "active",
    startedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readJsonStore();
  await writeJsonStore([record, ...all]);
  return record;
}

export async function listActiveBacklog(childId: string): Promise<BacklogRecord[]> {
  if (isPostgresEnabled()) {
    const rows = await prisma.backlogPlan.findMany({ where: { childId, status: "active" }, orderBy: { createdAt: "desc" } });
    return rows.map(rowToRecord);
  }
  const all = await readJsonStore();
  return all.filter((r) => r.childId === childId && r.status === "active");
}

async function readJsonStore(): Promise<BacklogRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as BacklogRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: BacklogRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function rowToRecord(row: {
  id: string;
  userId: string | null;
  childId: string;
  subject: string;
  chapter: string;
  weakConcepts: unknown;
  dailyPlan: unknown;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BacklogRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    childId: row.childId,
    subject: row.subject,
    chapter: row.chapter,
    weakConcepts: Array.isArray(row.weakConcepts) ? row.weakConcepts.filter((s): s is string => typeof s === "string") : [],
    dailyPlan: toDailyPlan(row.dailyPlan),
    status: row.status === "completed" ? "completed" : "active",
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDailyPlan(value: unknown): { day: number; focus: string; tasks: string[] }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { day: number; focus: string; tasks: unknown } => typeof item === "object" && item !== null && typeof (item as { day?: unknown }).day === "number")
    .map((item) => ({
      day: item.day,
      focus: typeof item.focus === "string" ? item.focus : "",
      tasks: Array.isArray(item.tasks) ? item.tasks.filter((t: unknown): t is string => typeof t === "string") : [],
    }));
}
