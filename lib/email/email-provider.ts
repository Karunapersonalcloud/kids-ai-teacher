import type { AccessRequest } from "@/lib/access-store";
import { approvalEmailHtml, approvalEmailSubject, approvalEmailText, buildLoginInstructions } from "./templates";

export type ApprovalEmailResult = {
  sent: boolean;
  status: "sent" | "not_configured" | "failed";
  error?: string;
};

export async function sendApprovalEmail(request: AccessRequest): Promise<ApprovalEmailResult> {
  if (!request.email || !request.tempPin) {
    return { sent: false, status: "failed", error: "Missing parent email or temporary PIN." };
  }

  const provider = process.env.EMAIL_PROVIDER || "console";
  if (provider !== "resend") {
    console.warn("Email provider not configured. Login instructions were not emailed.");
    return { sent: false, status: "not_configured", error: "Email provider not configured. Login instructions were not emailed." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("Email provider not configured. Login instructions were not emailed.");
    return { sent: false, status: "not_configured", error: "Email provider not configured. Login instructions were not emailed." };
  }

  const instructions = buildLoginInstructions(request);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: request.email,
      subject: approvalEmailSubject(),
      text: approvalEmailText(request.parentName, instructions),
      html: approvalEmailHtml(request.parentName, instructions),
    }),
  });

  if (!response.ok) {
    return { sent: false, status: "failed", error: "Email provider rejected the message. Use Copy Login Instructions." };
  }

  return { sent: true, status: "sent" };
}
