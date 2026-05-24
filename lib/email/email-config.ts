export const SUPPORT_EMAIL = "support@conceptkid.in";

export type EmailConfig = {
  provider: string;
  from: string;
  appBaseUrl: string;
};

export function getEmailConfig(): EmailConfig {
  return {
    provider: process.env.EMAIL_PROVIDER || "",
    from: process.env.EMAIL_FROM || `ConceptKid Support <${SUPPORT_EMAIL}>`,
    appBaseUrl: process.env.APP_BASE_URL || "https://conceptkid.in",
  };
}
