import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
import type { DiagnosticAnswer, DiagnosticScore } from "./diagnostic-catalog";

export type DiagnosticRecord = {
  id: string;
  userId?: string;
  childId: string;
  grade: string;
  subject: string;
  score: number;
  total: number;
  percentage: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendedStartLevel: string;
  riskLevel: string;
  learningPlan: string[];
  answers: DiagnosticAnswer[];
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "diagnostic-results.json");

export async function saveDiagnosticResult(input: {
  userId?: string;
  childId: string;
  grade: string;
  subject: string;
  answers: DiagnosticAnswer[];
  score: DiagnosticScore;
}): Promise<DiagnosticRecord> {
  const now = new Date();
  const base = {
    userId: input.userId,
    childId: input.childId,
    grade: input.grade,
    subject: input.subject,
    score: input.score.score,
    total: input.score.total,
    percentage: input.score.percentage,
    weakAreas: input.score.weakAreas,
    strongAreas: input.score.strongAreas,
    recommendedStartLevel: input.score.recommendedStartLevel,
    riskLevel: input.score.riskLevel,
    learningPlan: input.score.learningPlan,
    answers: input.answers,
    completedAt: now.toISOString(),
  };

  if (isPostgresEnabled()) {
    const created = await prisma.diagnosticResult.create({
      data: {
        userId: input.userId,
        childId: input.childId,
        grade: input.grade,
        subject: input.subject,
        score: input.score.score,
        total: input.score.total,
        percentage: input.score.percentage,
        weakAreas: input.score.weakAreas,
        strongAreas: input.score.strongAreas,
        recommendedStartLevel: input.score.recommendedStartLevel,
        riskLevel: input.score.riskLevel,
        learningPlan: input.score.learningPlan,
        answers: input.answers,
        completedAt: now,
      },
    });
    return rowToRecord(created);
  }

  const record: DiagnosticRecord = {
    ...base,
    id: randomUUID(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const all = await readJsonStore();
  await writeJsonStore([record, ...all]);
  return record;
}

export async function getLatestDiagnosticForChild(childId: string): Promise<DiagnosticRecord | undefined> {
  if (isPostgresEnabled()) {
    const row = await prisma.diagnosticResult.findFirst({
      where: { childId },
      orderBy: { completedAt: "desc" },
    });
    return row ? rowToRecord(row) : undefined;
  }

  const all = await readJsonStore();
  return all.find((item) => item.childId === childId);
}

export async function getAllDiagnosticsForUser(userId: string): Promise<DiagnosticRecord[]> {
  if (isPostgresEnabled()) {
    const rows = await prisma.diagnosticResult.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
    });
    return rows.map(rowToRecord);
  }

  const all = await readJsonStore();
  return all.filter((item) => item.userId === userId);
}

async function readJsonStore(): Promise<DiagnosticRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as DiagnosticRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: DiagnosticRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function rowToRecord(row: {
  id: string;
  userId: string | null;
  childId: string;
  grade: string;
  subject: string;
  score: number;
  total: number;
  percentage: number;
  weakAreas: unknown;
  strongAreas: unknown;
  recommendedStartLevel: string | null;
  riskLevel: string | null;
  learningPlan: unknown;
  answers: unknown;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): DiagnosticRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    childId: row.childId,
    grade: row.grade,
    subject: row.subject,
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    weakAreas: toStringArray(row.weakAreas),
    strongAreas: toStringArray(row.strongAreas),
    recommendedStartLevel: row.recommendedStartLevel || "",
    riskLevel: row.riskLevel || "Medium",
    learningPlan: toStringArray(row.learningPlan),
    answers: Array.isArray(row.answers) ? (row.answers as DiagnosticAnswer[]) : [],
    completedAt: row.completedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
