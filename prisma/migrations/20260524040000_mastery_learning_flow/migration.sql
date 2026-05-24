-- Mastery learning flow: multi-child registration draft + diagnostic + chapter pre-check + mastery + revision + backlog + homework + exam plan.

-- 1. Support multi-child registration (JSON array of child drafts) on AccessRequest.
ALTER TABLE "AccessRequest" ADD COLUMN "submittedChildren" JSONB;

-- 2. Baseline diagnostic test result per child + subject.
CREATE TABLE "DiagnosticResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "weakAreas" JSONB,
    "strongAreas" JSONB,
    "recommendedStartLevel" TEXT,
    "learningPlan" JSONB,
    "riskLevel" TEXT,
    "answers" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiagnosticResult_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DiagnosticResult_userId_idx" ON "DiagnosticResult"("userId");
CREATE INDEX "DiagnosticResult_childId_subject_idx" ON "DiagnosticResult"("childId", "subject");
CREATE INDEX "DiagnosticResult_completedAt_idx" ON "DiagnosticResult"("completedAt");

-- 3. Chapter pre-check (readiness) before teaching.
CREATE TABLE "ChapterReadinessResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "readinessStatus" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "weakPrerequisites" JSONB,
    "recommendedPrerequisiteLessons" JSONB,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChapterReadinessResult_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChapterReadinessResult_userId_idx" ON "ChapterReadinessResult"("userId");
CREATE INDEX "ChapterReadinessResult_childId_subject_chapter_idx" ON "ChapterReadinessResult"("childId", "subject", "chapter");

-- 4. Per-chapter mastery tracking (95% gate).
CREATE TABLE "ChapterMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "weakConcepts" JSONB,
    "lastAttemptAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChapterMastery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChapterMastery_childId_subject_chapter_key" ON "ChapterMastery"("childId", "subject", "chapter");
CREATE INDEX "ChapterMastery_userId_idx" ON "ChapterMastery"("userId");
CREATE INDEX "ChapterMastery_childId_subject_idx" ON "ChapterMastery"("childId", "subject");
CREATE INDEX "ChapterMastery_status_idx" ON "ChapterMastery"("status");

-- 5. Targeted revision tasks for weak concepts.
CREATE TABLE "RevisionTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT,
    "concept" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueOn" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RevisionTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RevisionTask_userId_idx" ON "RevisionTask"("userId");
CREATE INDEX "RevisionTask_childId_subject_idx" ON "RevisionTask"("childId", "subject");
CREATE INDEX "RevisionTask_status_idx" ON "RevisionTask"("status");

-- 6. Backlog strengthening plan per chapter.
CREATE TABLE "BacklogPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "weakConcepts" JSONB,
    "dailyPlan" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BacklogPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BacklogPlan_childId_subject_chapter_idx" ON "BacklogPlan"("childId", "subject", "chapter");
CREATE INDEX "BacklogPlan_status_idx" ON "BacklogPlan"("status");

-- 7. Homework / notebook image submissions for review and OCR.
CREATE TABLE "HomeworkSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT,
    "chapter" TEXT,
    "topic" TEXT,
    "imageUrl" TEXT,
    "filePath" TEXT,
    "ocrText" TEXT,
    "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "score" DOUBLE PRECISION,
    "feedback" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeworkSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HomeworkSubmission_userId_idx" ON "HomeworkSubmission"("userId");
CREATE INDEX "HomeworkSubmission_childId_subject_idx" ON "HomeworkSubmission"("childId", "subject");
CREATE INDEX "HomeworkSubmission_status_idx" ON "HomeworkSubmission"("status");

-- 8. Exam preparation plan from teacher-provided portions.
CREATE TABLE "ExamPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),
    "subjects" JSONB,
    "chapters" JSONB,
    "weightage" JSONB,
    "portionImageUrl" TEXT,
    "readinessScore" DOUBLE PRECISION,
    "dailyPlan" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExamPlan_userId_idx" ON "ExamPlan"("userId");
CREATE INDEX "ExamPlan_childId_idx" ON "ExamPlan"("childId");
CREATE INDEX "ExamPlan_examDate_idx" ON "ExamPlan"("examDate");
