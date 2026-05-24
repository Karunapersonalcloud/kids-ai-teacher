import { getEmailConfig } from "./email-config";
import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { sent: true; reason: "SENT" }
  | {
      sent: false;
      reason:
        | "EMAIL_PROVIDER_NOT_CONFIGURED"
        | "EMAIL_PROVIDER_CONFIG_INCOMPLETE"
        | "RESEND_SEND_FAILED"
        | "UNSUPPORTED_EMAIL_PROVIDER";
      message: string;
    };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = config.provider.trim().toLowerCase();

  if (!provider) {
    console.warn("Email provider not configured. Login instructions were not emailed.");
    return {
      sent: false,
      reason: "EMAIL_PROVIDER_NOT_CONFIGURED",
      message: "Email provider not configured. Use Copy Login Instructions.",
    };
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();

    if (!apiKey || !from) {
      console.warn("Resend email provider is missing required configuration.");
      return {
        sent: false,
        reason: "EMAIL_PROVIDER_CONFIG_INCOMPLETE",
        message: "Email provider is missing configuration. Use Copy Login Instructions.",
      };
    }

    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error) {
        console.warn("Resend email send failed.");
        return {
          sent: false,
          reason: "RESEND_SEND_FAILED",
          message: "Email provider could not send the message. Use Copy Login Instructions.",
        };
      }

      return { sent: true, reason: "SENT" };
    } catch {
      console.warn("Resend email send failed.");
      return {
        sent: false,
        reason: "RESEND_SEND_FAILED",
        message: "Email provider could not send the message. Use Copy Login Instructions.",
      };
    }
  }

  return {
    sent: false,
    reason: "UNSUPPORTED_EMAIL_PROVIDER",
    message: "Email provider is not active yet. Use Copy Login Instructions.",
  };
}
