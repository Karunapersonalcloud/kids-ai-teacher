-- Add student login support fields on Child in an additive, non-destructive way.
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "studentLoginId" TEXT;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "studentPasswordHash" TEXT;
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "mustChangeStudentPassword" BOOLEAN NOT NULL DEFAULT true;

-- Legacy compatibility: if a previous schema introduced studentCredentialHash,
-- copy it into studentPasswordHash where the new field is still empty.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Child'
      AND column_name = 'studentCredentialHash'
  ) THEN
    EXECUTE 'UPDATE "Child" SET "studentPasswordHash" = COALESCE("studentPasswordHash", "studentCredentialHash")';
  END IF;
END $$;

-- Ensure default on existing environments where column already existed with a different default.
ALTER TABLE "Child" ALTER COLUMN "mustChangeStudentPassword" SET DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "Child_studentLoginId_key" ON "Child"("studentLoginId");
CREATE INDEX IF NOT EXISTS "Child_studentLoginId_idx" ON "Child"("studentLoginId");
