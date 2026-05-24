-- Add parent/student-selected school language fields.
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "r1Language" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "r2Language" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "r3Language" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN IF NOT EXISTS "regionalLanguage" TEXT;

ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "r1Language" TEXT;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "r2Language" TEXT;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "r3Language" TEXT;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "regionalLanguage" TEXT;
