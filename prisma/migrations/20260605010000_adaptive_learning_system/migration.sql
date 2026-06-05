-- Safe additive adaptive learning upgrade.
-- Do not drop/recreate tables and do not delete data.

ALTER TABLE "DiagnosticResult"
ADD COLUMN IF NOT EXISTS "actualLearningLevel" TEXT,
ADD COLUMN IF NOT EXISTS "gradeReadinessPercentage" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "recommendedStartingPoint" TEXT,
ADD COLUMN IF NOT EXISTS "foundationRecoveryRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "readingLevel" TEXT,
ADD COLUMN IF NOT EXISTS "writingLevel" TEXT,
ADD COLUMN IF NOT EXISTS "numberRecognitionLevel" TEXT,
ADD COLUMN IF NOT EXISTS "arithmeticLevel" TEXT,
ADD COLUMN IF NOT EXISTS "subjectFoundationLevel" TEXT,
ADD COLUMN IF NOT EXISTS "classLevelReadiness" TEXT,
ADD COLUMN IF NOT EXISTS "learningSpeed" TEXT,
ADD COLUMN IF NOT EXISTS "mistakePatterns" JSONB,
ADD COLUMN IF NOT EXISTS "domainLevels" JSONB;

CREATE TABLE IF NOT EXISTS "LearningPath" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "enrolledGrade" TEXT NOT NULL,
    "actualLearningLevel" TEXT NOT NULL,
    "currentPhase" TEXT NOT NULL,
    "recommendedStartingPoint" TEXT NOT NULL,
    "gradeReadinessPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "foundationRecoveryRequired" BOOLEAN NOT NULL DEFAULT false,
    "targetScore" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "dailyAvailableMinutes" INTEGER NOT NULL DEFAULT 45,
    "status" TEXT NOT NULL DEFAULT 'active',
    "foundationTopics" JSONB,
    "bridgeTopics" JSONB,
    "classSyllabusTopics" JSONB,
    "revisionTopics" JSONB,
    "mockTestSchedule" JSONB,
    "weakTopicRepairLoop" JSONB,
    "todayPlan" JSONB,
    "weeklyPlan" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LearningPath_userId_idx" ON "LearningPath"("userId");
CREATE INDEX IF NOT EXISTS "LearningPath_childId_idx" ON "LearningPath"("childId");
CREATE INDEX IF NOT EXISTS "LearningPath_status_idx" ON "LearningPath"("status");

CREATE TABLE IF NOT EXISTS "TopicMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Not started',
    "diagnosticScore" DOUBLE PRECISION,
    "quizScore" DOUBLE PRECISION,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    "mistakesRepeated" JSONB,
    "revisionScore" DOUBLE PRECISION,
    "mockTestScore" DOUBLE PRECISION,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextAction" TEXT,
    "prerequisiteTopic" TEXT,
    "lastPracticedAt" TIMESTAMP(3),
    "examReadyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopicMastery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TopicMastery_childId_subject_chapter_topic_key" ON "TopicMastery"("childId", "subject", "chapter", "topic");
CREATE INDEX IF NOT EXISTS "TopicMastery_userId_idx" ON "TopicMastery"("userId");
CREATE INDEX IF NOT EXISTS "TopicMastery_childId_subject_idx" ON "TopicMastery"("childId", "subject");
CREATE INDEX IF NOT EXISTS "TopicMastery_status_idx" ON "TopicMastery"("status");

CREATE TABLE IF NOT EXISTS "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT,
    "topic" TEXT NOT NULL,
    "attemptType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "mistakes" JSONB,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PracticeAttempt_userId_idx" ON "PracticeAttempt"("userId");
CREATE INDEX IF NOT EXISTS "PracticeAttempt_childId_subject_topic_idx" ON "PracticeAttempt"("childId", "subject", "topic");
CREATE INDEX IF NOT EXISTS "PracticeAttempt_createdAt_idx" ON "PracticeAttempt"("createdAt");

CREATE TABLE IF NOT EXISTS "ExamReadinessPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "examName" TEXT NOT NULL DEFAULT 'Annual Exam',
    "targetScore" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "examDate" TIMESTAMP(3),
    "currentReadinessPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predictedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyAvailableMinutes" INTEGER NOT NULL DEFAULT 45,
    "syllabusSize" INTEGER NOT NULL DEFAULT 0,
    "weakTopics" JSONB,
    "topicsBlockingTarget" JSONB,
    "dailyStudyPlan" JSONB,
    "weeklyRevisionPlan" JSONB,
    "mockTestSchedule" JSONB,
    "readinessBySubject" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamReadinessPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExamReadinessPlan_userId_idx" ON "ExamReadinessPlan"("userId");
CREATE INDEX IF NOT EXISTS "ExamReadinessPlan_childId_idx" ON "ExamReadinessPlan"("childId");
CREATE INDEX IF NOT EXISTS "ExamReadinessPlan_examDate_idx" ON "ExamReadinessPlan"("examDate");
CREATE INDEX IF NOT EXISTS "ExamReadinessPlan_status_idx" ON "ExamReadinessPlan"("status");
