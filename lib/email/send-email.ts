import { getEmailConfig } from "./email-config";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { sent: true; reason: "SENT" }
  | { sent: false; reason: "EMAIL_PROVIDER_NOT_CONFIGURED" | "UNSUPPORTED_EMAIL_PROVIDER"; message: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getEmailConfig();
  void input;

  if (!config.provider) {
    console.warn("Email provider not configured. Login instructions were not emailed.");
    return {
      sent: false,
      reason: "EMAIL_PROVIDER_NOT_CONFIGURED",
      message: "Email provider not configured. Use Copy Login Instructions.",
    };
  }

  return {
    sent: false,
    reason: "UNSUPPORTED_EMAIL_PROVIDER",
    message: "Email provider is not active yet. Use Copy Login Instructions.",
  };
}
