-- Store the exact subjects selected by parent/student during registration.
ALTER TABLE "AccessRequest" ADD COLUMN "submittedSubjects" JSONB;
ALTER TABLE "Child" ADD COLUMN "submittedSubjects" JSONB;

CREATE TABLE "StudentSubject" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT,
    "accessRequestId" TEXT,
    "subjectName" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "languageRole" TEXT,
    "language" TEXT,
    "publisher" TEXT NOT NULL,
    "bookTitle" TEXT,
    "medium" TEXT,
    "autoDownloadAllowed" BOOLEAN NOT NULL DEFAULT false,
    "sourceStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSubject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentSubject_userId_idx" ON "StudentSubject"("userId");
CREATE INDEX "StudentSubject_childId_idx" ON "StudentSubject"("childId");
CREATE INDEX "StudentSubject_accessRequestId_idx" ON "StudentSubject"("accessRequestId");
CREATE INDEX "StudentSubject_subjectName_idx" ON "StudentSubject"("subjectName");
CREATE INDEX "StudentSubject_sourceStatus_idx" ON "StudentSubject"("sourceStatus");

ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
