import type { ChildId } from "./types";

export type AppRole = "parent" | "student";

export type AppSession = {
  userId: string;
  role: AppRole;
  displayName: string;
  childId?: ChildId;
};

export const demoParentSession: AppSession = {
  userId: "demo-parent",
  role: "parent",
  displayName: "Parent",
};

export const demoStudentSessions: AppSession[] = [
  { userId: "student-jayadeep", role: "student", displayName: "Jayadeep", childId: "jayadeep" },
  { userId: "student-harini", role: "student", displayName: "Harini", childId: "harini" },
];

export function canAccessParentArea(session: AppSession | null) {
  return session?.role === "parent";
}

export function canViewChild(session: AppSession | null, childId: ChildId) {
  if (!session) return false;
  if (session.role === "parent") return true;
  return session.childId === childId;
}
