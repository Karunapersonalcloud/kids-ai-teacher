ALTER TABLE "AccessRequest" ADD COLUMN "loginEmailSentAt" TIMESTAMP(3);
ALTER TABLE "AccessRequest" ADD COLUMN "loginEmailStatus" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN "loginEmailError" TEXT;
