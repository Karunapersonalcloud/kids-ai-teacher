-- Add parent and student lockout fields for database-backed login protection.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lockedReason" TEXT,
ADD COLUMN IF NOT EXISTS "unlockedAt" TIMESTAMP(3);

ALTER TABLE "Child"
ADD COLUMN IF NOT EXISTS "studentFailedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "studentLockedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "studentLockedReason" TEXT,
ADD COLUMN IF NOT EXISTS "studentUnlockedAt" TIMESTAMP(3);
