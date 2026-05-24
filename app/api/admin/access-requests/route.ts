import { getLimitsForPlan } from "@/lib/access-control";
import { generateTemporaryPin, readAccessRequests, updateAccessRequest } from "@/lib/access-store";
import type { PlanName } from "@/lib/billing-types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Admin access required." }, { status: 403 });
  return Response.json({ requests: await readAccessRequests() });
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Admin access required." }, { status: 403 });
  const body = (await request.json()) as { id?: string; action?: string; notes?: string; expiryDate?: string; dailyAiLimit?: number };
  if (!body.id || !body.action) {
    return Response.json({ error: "id and action are required." }, { status: 400 });
  }

  const patch = patchForAction(body.action, body);
  const updated = await updateAccessRequest(body.id, patch);
  if (!updated) return Response.json({ error: "Request not found." }, { status: 404 });
  return Response.json({ request: updated });
}

function isAdmin(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("kids_access_role=admin") && cookie.includes("kids_access_status=active");
}

function patchForAction(action: string, body: { notes?: string; expiryDate?: string; dailyAiLimit?: number }) {
  if (action === "approve-trial") return withPlan("trial", approvedPatch({ status: "trial" as const, expiryDate: body.expiryDate || plusDays(14), notes: body.notes || "Approved for trial." }));
  if (action === "approve-full") return withPlan("basic", approvedPatch({ status: "active" as const, expiryDate: body.expiryDate, notes: body.notes || "Approved for full access." }));
  if (action === "reject") return { status: "rejected" as const, notes: body.notes || "Rejected by admin." };
  if (action === "block") return { status: "blocked" as const, notes: body.notes || "Blocked by admin." };
  if (action === "extend") return { expiryDate: body.expiryDate || plusDays(30), notes: body.notes || "Access extended." };
  if (action === "set-limit") return { dailyAiLimit: body.dailyAiLimit || 20, notes: body.notes || "Daily AI limit updated." };
  if (action === "reset-pin") return approvedPatch({ notes: body.notes || "Temporary PIN reset by admin." });
  return {};
}

function approvedPatch(patch: Record<string, unknown>) {
  const tempPin = generateTemporaryPin();
  const now = new Date().toISOString();
  return {
    ...patch,
    tempPin,
    credentialHash: tempPin,
    mustChangeCredentials: true,
    tempCredentialsIssuedAt: now,
    approvedAt: now,
    approvedBy: "Family Admin",
  };
}

function withPlan(plan: PlanName, patch: Record<string, unknown>) {
  const limits = getLimitsForPlan(plan);
  return {
    ...patch,
    plan,
    maxChildren: limits.maxChildren,
    dailyAiLimit: limits.dailyAiMessages,
    uploadLimit: limits.uploadLimit,
    ocrLimit: limits.ocrLimit,
    visualLessonLimit: limits.visualLessonLimit,
    quizGenerationLimit: limits.quizGenerationLimit,
    canDownloadMaterials: plan === "family",
    canUploadMaterials: true,
    canUseAI: true,
    canUseOCR: plan === "premium" || plan === "family",
    canImportFromDrive: false,
    canIndexMaterials: false,
  };
}

function plusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
