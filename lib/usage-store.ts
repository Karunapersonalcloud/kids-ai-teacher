import { promises as fs } from "fs";
import path from "path";
import type { PlanName } from "./billing-types";
import { getLimitsForPlan } from "./access-control";

export type UsageRecord = {
  userId: string;
  date: string;
  aiMessages: number;
  visualLessons: number;
  quizzes: number;
};

const usageRoot = path.join(process.cwd(), "storage");
const usagePath = path.join(usageRoot, "usage.json");

export async function readUsageRecords(): Promise<UsageRecord[]> {
  try {
    await fs.mkdir(usageRoot, { recursive: true });
    return JSON.parse(await fs.readFile(usagePath, "utf8")) as UsageRecord[];
  } catch {
    return [];
  }
}

export async function writeUsageRecords(records: UsageRecord[]) {
  await fs.mkdir(usageRoot, { recursive: true });
  await fs.writeFile(usagePath, JSON.stringify(records, null, 2), "utf8");
}

export async function checkAndIncrementAiUsage(userId: string, plan: PlanName, dailyLimitOverride?: number) {
  const today = new Date().toISOString().slice(0, 10);
  const records = await readUsageRecords();
  const existing = records.find((record) => record.userId === userId && record.date === today) || { userId, date: today, aiMessages: 0, visualLessons: 0, quizzes: 0 };
  const limit = dailyLimitOverride || getLimitsForPlan(plan).dailyAiMessages;

  if (existing.aiMessages >= limit) {
    return { allowed: false, used: existing.aiMessages, limit };
  }

  const updated = { ...existing, aiMessages: existing.aiMessages + 1 };
  await writeUsageRecords([updated, ...records.filter((record) => !(record.userId === userId && record.date === today))]);
  return { allowed: true, used: updated.aiMessages, limit };
}
