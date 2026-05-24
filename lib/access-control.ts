import type { PlanName } from "./billing-types";
import { getPlan } from "./billing-types";

export type UserRole = "guest" | "parent" | "student" | "admin";
export type AccessStatus = "guest" | "pending" | "trial" | "active" | "expired" | "rejected" | "blocked";

export type AccessSession = {
  userId: string;
  email: string;
  role: UserRole;
  status: AccessStatus;
  plan: PlanName;
};

export type AccessLimits = {
  maxChildren: number;
  dailyAiMessages: number;
  uploadLimit: number;
  ocrLimit: number;
  visualLessonLimit: number;
  quizGenerationLimit: number;
};

export function getLimitsForPlan(plan: PlanName): AccessLimits {
  const billing = getPlan(plan);
  return {
    maxChildren: billing.maxChildren,
    dailyAiMessages: billing.aiLimitDaily,
    uploadLimit: billing.uploadLimitMonthly,
    ocrLimit: billing.ocrLimitMonthly,
    visualLessonLimit: billing.visualLessonLimitDaily,
    quizGenerationLimit: billing.quizGenerationLimitDaily,
  };
}

export function canUseFullApp(session?: Partial<AccessSession>) {
  return session?.status === "trial" || session?.status === "active";
}

export function canUseAdmin(session?: Partial<AccessSession>) {
  return session?.role === "admin" && session.status === "active";
}

export function getAccessMessage(status?: AccessStatus) {
  if (status === "pending") return "Your registration is pending admin approval.";
  if (status === "blocked") return "This account is blocked. Please contact the administrator.";
  if (status === "rejected") return "This access request was not approved.";
  if (status === "expired") return "Your access has expired. Please contact the administrator.";
  return "Please login or register to unlock full learning.";
}
