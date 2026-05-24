import { getLimitsForPlan } from "@/lib/access-control";
import { generateTemporaryPin, readAccessRequests, updateAccessRequest } from "@/lib/access-store";
import { hashPin } from "@/lib/credentials";
import { sendApprovalEmail } from "@/lib/email/email-provider";
import { buildLoginInstructions } from "@/lib/email/templates";
import { getRequestAccess } from "@/lib/request-access";
import { normalizeSubmittedSubjects, type SubmittedSubject } from "@/lib/student-subjects";
import type { PlanName } from "@/lib/billing-types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  return Response.json({ requests: await readAccessRequests() });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const body = (await request.json()) as { id?: string; action?: string; notes?: string; expiryDate?: string; dailyAiLimit?: number };
  if (!body.id || !body.action) {
    return Response.json({ error: "id and action are required." }, { status: 400 });
  }

  if (body.action === "mark-upload-required" || body.action === "trigger-ncert-download") {
    const requests = await readAccessRequests();
    const current = requests.find((item) => item.id === body.id);
    if (!current) return Response.json({ error: "Request not found." }, { status: 404 });
    const subjects = normalizeSubmittedSubjects(current.submittedSubjects);
    const nextSubjects = body.action === "mark-upload-required" ? markUploadRequired(subjects) : markNcertForDownload(subjects);
    const updated = await updateAccessRequest(body.id, {
      submittedSubjects: JSON.stringify(nextSubjects),
      notes:
        body.action === "mark-upload-required"
          ? "Textbook upload required for selected subjects."
          : "NCERT download eligibility checked. Student-scoped import can run only for matched official NCERT books.",
    });
    return Response.json({ request: updated });
  }

  const patch = patchForAction(body.action, body);
  const updated = await updateAccessRequest(body.id, patch);
  if (!updated) return Response.json({ error: "Request not found." }, { status: 404 });

  if (body.action === "approve-trial" || body.action === "approve-full") {
    const emailResult = await sendApprovalEmail(updated);
    const emailPatch = {
      loginEmailSentAt: emailResult.sent ? new Date().toISOString() : undefined,
      loginEmailStatus: emailResult.status,
      loginEmailError: emailResult.error || "",
    };
    const requestWithEmailStatus = (await updateAccessRequest(body.id, emailPatch)) || updated;
    return Response.json({
      request: requestWithEmailStatus,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
      loginInstructions: buildLoginInstructions(updated),
      message: emailResult.sent ? "Approved and login instructions emailed." : "Approved, but email not sent. Use Copy Login Instructions.",
    });
  }

  return Response.json({ request: updated });
}

function markUploadRequired(subjects: SubmittedSubject[]) {
  return subjects.map((subject) => ({
    ...subject,
    autoDownloadAllowed: false,
    sourceStatus: "needsUpload" as const,
  }));
}

function markNcertForDownload(subjects: SubmittedSubject[]) {
  return subjects.map((subject) => {
    if (subject.publisher !== "NCERT") {
      return { ...subject, sourceStatus: "needsUpload" as const };
    }

    if (!subject.autoDownloadAllowed || !subject.bookTitle.trim()) {
      return { ...subject, sourceStatus: "needsUpload" as const };
    }

    return { ...subject, sourceStatus: "matched" as const };
  });
}

async function isAdmin(request: Request) {
  const access = await getRequestAccess(request);
  return access.role === "admin" && access.userType === "internalFamily" && access.status === "active";
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
    // tempPin is shown once to the admin for hand-off; credentialHash stores
    // the hashed value so login does not compare plain text.
    tempPin,
    credentialHash: hashPin(tempPin),
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
