-- Store CBSE language validation metadata selected during registration.
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "selectedLanguages" JSONB;
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "cbseLanguageRuleWarning" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "cbseLanguageValidationStatus" TEXT;

ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "selectedLanguages" JSONB;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "cbseLanguageRuleWarning" TEXT;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "cbseLanguageValidationStatus" TEXT;
