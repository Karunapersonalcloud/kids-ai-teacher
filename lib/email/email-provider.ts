import type { AccessRequest } from "@/lib/access-store";
import { sendEmail } from "./send-email";
import { approvalLoginInstructionsEmail, buildLoginInstructions } from "./templates";

export type ApprovalEmailResult = {
  sent: boolean;
  status: "sent" | "not_configured" | "unsupported";
  error?: string;
};

export async function sendApprovalEmail(request: AccessRequest): Promise<ApprovalEmailResult> {
  if (!request.email || !request.tempPin) {
    return { sent: false, status: "not_configured", error: "Missing parent email or temporary PIN." };
  }

  const instructions = buildLoginInstructions(request);
  const email = approvalLoginInstructionsEmail({
    parentName: request.parentName,
    loginId: instructions.loginIdentifier,
    tempPin: instructions.temporaryPin,
    plan: instructions.planLabel,
    children: instructions.children,
    loginUrl: instructions.loginUrl,
  });

  const result = await sendEmail({
    to: request.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (result.sent) return { sent: true, status: "sent" };
  return {
    sent: false,
    status: result.reason === "UNSUPPORTED_EMAIL_PROVIDER" ? "unsupported" : "not_configured",
    error: result.message,
  };
}
