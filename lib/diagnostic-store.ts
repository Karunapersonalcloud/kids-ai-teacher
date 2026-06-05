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
  actualLearningLevel: string;
  gradeReadinessPercentage: number;
  recommendedStartingPoint: string;
  foundationRecoveryRequired: boolean;
  readingLevel: string;
  writingLevel: string;
  numberRecognitionLevel: string;
  arithmeticLevel: string;
  subjectFoundationLevel: string;
  classLevelReadiness: string;
  learningSpeed: string;
  mistakePatterns: { area: string; pattern: string; repairAction: string }[];
  domainLevels: Record<string, { percentage: number; level: string }>;
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
    actualLearningLevel: input.score.actualLearningLevel,
    gradeReadinessPercentage: input.score.gradeReadinessPercentage,
    recommendedStartingPoint: input.score.recommendedStartingPoint,
    foundationRecoveryRequired: input.score.foundationRecoveryRequired,
    readingLevel: input.score.readingLevel,
    writingLevel: input.score.writingLevel,
    numberRecognitionLevel: input.score.numberRecognitionLevel,
    arithmeticLevel: input.score.arithmeticLevel,
    subjectFoundationLevel: input.score.subjectFoundationLevel,
    classLevelReadiness: input.score.classLevelReadiness,
    learningSpeed: input.score.learningSpeed,
    mistakePatterns: input.score.mistakePatterns,
    domainLevels: input.score.domainLevels,
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
        actualLearningLevel: input.score.actualLearningLevel,
        gradeReadinessPercentage: input.score.gradeReadinessPercentage,
        recommendedStartingPoint: input.score.recommendedStartingPoint,
        foundationRecoveryRequired: input.score.foundationRecoveryRequired,
        readingLevel: input.score.readingLevel,
        writingLevel: input.score.writingLevel,
        numberRecognitionLevel: input.score.numberRecognitionLevel,
        arithmeticLevel: input.score.arithmeticLevel,
        subjectFoundationLevel: input.score.subjectFoundationLevel,
        classLevelReadiness: input.score.classLevelReadiness,
        learningSpeed: input.score.learningSpeed,
        mistakePatterns: input.score.mistakePatterns,
        domainLevels: input.score.domainLevels,
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
  actualLearningLevel?: string | null;
  gradeReadinessPercentage?: number | null;
  recommendedStartingPoint?: string | null;
  foundationRecoveryRequired?: boolean | null;
  readingLevel?: string | null;
  writingLevel?: string | null;
  numberRecognitionLevel?: string | null;
  arithmeticLevel?: string | null;
  subjectFoundationLevel?: string | null;
  classLevelReadiness?: string | null;
  learningSpeed?: string | null;
  mistakePatterns?: unknown;
  domainLevels?: unknown;
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
    actualLearningLevel: row.actualLearningLevel || row.recommendedStartLevel || "Unknown level",
    gradeReadinessPercentage: row.gradeReadinessPercentage ?? row.percentage,
    recommendedStartingPoint: row.recommendedStartingPoint || row.recommendedStartLevel || "Baseline diagnostic",
    foundationRecoveryRequired: Boolean(row.foundationRecoveryRequired),
    readingLevel: row.readingLevel || "Not measured",
    writingLevel: row.writingLevel || "Not measured",
    numberRecognitionLevel: row.numberRecognitionLevel || "Not measured",
    arithmeticLevel: row.arithmeticLevel || "Not measured",
    subjectFoundationLevel: row.subjectFoundationLevel || "Not measured",
    classLevelReadiness: row.classLevelReadiness || "Not measured",
    learningSpeed: row.learningSpeed || "Steady with revision support",
    mistakePatterns: toMistakePatterns(row.mistakePatterns),
    domainLevels: toDomainLevels(row.domainLevels),
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

function toMistakePatterns(value: unknown): DiagnosticRecord["mistakePatterns"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const record = item as Record<string, unknown>;
      return {
        area: typeof record.area === "string" ? record.area : "",
        pattern: typeof record.pattern === "string" ? record.pattern : "",
        repairAction: typeof record.repairAction === "string" ? record.repairAction : "",
      };
    })
    .filter((item): item is DiagnosticRecord["mistakePatterns"][number] => Boolean(item?.area));
}

function toDomainLevels(value: unknown): DiagnosticRecord["domainLevels"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [key, { percentage: 0, level: "Not measured" }];
    const record = item as Record<string, unknown>;
    return [
      key,
      {
        percentage: typeof record.percentage === "number" ? record.percentage : 0,
        level: typeof record.level === "string" ? record.level : "Not measured",
      },
    ];
  });
  return Object.fromEntries(entries);
}
