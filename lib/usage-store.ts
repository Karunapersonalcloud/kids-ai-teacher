import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
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
  if (isPostgresEnabled()) {
    const rows = await prisma.aiUsage.findMany({ where: { feature: "chat" } });
    return rows.map((row) => ({
      userId: row.actorKey,
      date: row.dateKey,
      aiMessages: row.count,
      visualLessons: 0,
      quizzes: 0,
    }));
  }

  try {
    await fs.mkdir(usageRoot, { recursive: true });
    return JSON.parse(await fs.readFile(usagePath, "utf8")) as UsageRecord[];
  } catch {
    return [];
  }
}

export async function writeUsageRecords(records: UsageRecord[]) {
  if (isPostgresEnabled()) {
    await Promise.all(
      records.map(async (record) => {
        const actorKey = record.userId || "demo-user";
        const userId = await resolveAiUsageUserId(actorKey);
        return prisma.aiUsage.upsert({
          where: { actorKey_dateKey_feature: { actorKey, dateKey: record.date, feature: "chat" } },
          update: { count: record.aiMessages },
          create: { actorKey, userId, dateKey: record.date, feature: "chat", count: record.aiMessages },
        });
      })
    );
    return;
  }

  await fs.mkdir(usageRoot, { recursive: true });
  await fs.writeFile(usagePath, JSON.stringify(records, null, 2), "utf8");
}

export async function checkAndIncrementAiUsage(userId: string, plan: PlanName, dailyLimitOverride?: number) {
  const today = new Date().toISOString().slice(0, 10);
  const limit = dailyLimitOverride || getLimitsForPlan(plan).dailyAiMessages;

  if (isPostgresEnabled()) {
    const actorKey = userId || "demo-user";
    const existing = await prisma.aiUsage.findUnique({ where: { actorKey_dateKey_feature: { actorKey, dateKey: today, feature: "chat" } } });
    if ((existing?.count || 0) >= limit) {
      return { allowed: false, used: existing?.count || 0, limit };
    }
    const updated = await prisma.aiUsage.upsert({
      where: { actorKey_dateKey_feature: { actorKey, dateKey: today, feature: "chat" } },
      update: { count: { increment: 1 } },
      create: { actorKey, userId: await resolveAiUsageUserId(actorKey), dateKey: today, feature: "chat", count: 1 },
    });
    return { allowed: true, used: updated.count, limit };
  }

  const records = await readUsageRecords();
  const existing = records.find((record) => record.userId === userId && record.date === today) || { userId, date: today, aiMessages: 0, visualLessons: 0, quizzes: 0 };

  if (existing.aiMessages >= limit) {
    return { allowed: false, used: existing.aiMessages, limit };
  }

  const updated = { ...existing, aiMessages: existing.aiMessages + 1 };
  await writeUsageRecords([updated, ...records.filter((record) => !(record.userId === userId && record.date === today))]);
  return { allowed: true, used: updated.aiMessages, limit };
}

async function resolveAiUsageUserId(actorKey: string) {
  if (!actorKey || actorKey.startsWith("demo")) return null;
  const user = await prisma.user.findUnique({ where: { id: actorKey }, select: { id: true } });
  return user?.id || null;
}
