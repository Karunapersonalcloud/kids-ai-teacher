-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "loginIdentifier" TEXT,
    "credentialHash" TEXT,
    "tempPin" TEXT,
    "mustChangeCredentials" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "dailyAiLimit" INTEGER NOT NULL DEFAULT 3,
    "uploadLimit" INTEGER NOT NULL DEFAULT 0,
    "canDownloadMaterials" BOOLEAN NOT NULL DEFAULT false,
    "canUploadMaterials" BOOLEAN NOT NULL DEFAULT false,
    "canUseAI" BOOLEAN NOT NULL DEFAULT true,
    "canUseOCR" BOOLEAN NOT NULL DEFAULT false,
    "canImportFromDrive" BOOLEAN NOT NULL DEFAULT false,
    "canIndexMaterials" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "classNumber" INTEGER,
    "board" TEXT,
    "preferredLanguage" TEXT,
    "weakSubjects" TEXT,
    "learningGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "city" TEXT,
    "preferredLanguage" TEXT,
    "childName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "classNumber" INTEGER,
    "board" TEXT,
    "preferredExplanationLanguage" TEXT,
    "weakSubjects" TEXT,
    "learningGoal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "role" TEXT NOT NULL DEFAULT 'parent',
    "userType" TEXT NOT NULL DEFAULT 'externalUser',
    "plan" TEXT NOT NULL DEFAULT 'demo',
    "loginIdentifier" TEXT,
    "expiryDate" TIMESTAMP(3),
    "dailyAiLimit" INTEGER NOT NULL DEFAULT 3,
    "uploadLimit" INTEGER NOT NULL DEFAULT 0,
    "ocrLimit" INTEGER NOT NULL DEFAULT 0,
    "visualLessonLimit" INTEGER NOT NULL DEFAULT 2,
    "quizGenerationLimit" INTEGER NOT NULL DEFAULT 1,
    "maxChildren" INTEGER NOT NULL DEFAULT 1,
    "tempPin" TEXT,
    "credentialHash" TEXT,
    "mustChangeCredentials" BOOLEAN NOT NULL DEFAULT true,
    "tempCredentialsIssuedAt" TIMESTAMP(3),
    "canDownloadMaterials" BOOLEAN NOT NULL DEFAULT false,
    "canUploadMaterials" BOOLEAN NOT NULL DEFAULT false,
    "canUseAI" BOOLEAN NOT NULL DEFAULT false,
    "canUseOCR" BOOLEAN NOT NULL DEFAULT false,
    "canImportFromDrive" BOOLEAN NOT NULL DEFAULT false,
    "canIndexMaterials" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "actorKey" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadMaterial" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT,
    "childName" TEXT,
    "grade" TEXT,
    "subject" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "chapter" TEXT,
    "topic" TEXT,
    "title" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sizeLabel" TEXT,
    "source" TEXT NOT NULL,
    "originalSourceUrl" TEXT,
    "bookTitle" TEXT,
    "chapterNumber" INTEGER,
    "status" TEXT NOT NULL,
    "indexStatus" TEXT,
    "indexError" TEXT,
    "ocrStatus" TEXT,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "internalFamilyOnly" BOOLEAN NOT NULL DEFAULT false,
    "storagePath" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexedChunk" (
    "id" TEXT NOT NULL,
    "materialId" TEXT,
    "userId" TEXT,
    "childId" TEXT,
    "subject" TEXT NOT NULL,
    "title" TEXT,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "bookTitle" TEXT,
    "chapterNumber" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexedChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "topicsRevised" INTEGER NOT NULL DEFAULT 0,
    "quizzesAttempted" INTEGER NOT NULL DEFAULT 0,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "weakConcepts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "quizTitle" TEXT,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "weakConcepts" JSONB,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeakConcept" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "severity" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeakConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "dailyAiLimit" INTEGER NOT NULL,
    "uploadLimit" INTEGER NOT NULL,
    "paymentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "targetUserId" TEXT,
    "targetRequestId" TEXT,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_loginIdentifier_idx" ON "User"("loginIdentifier");

-- CreateIndex
CREATE INDEX "Child_userId_idx" ON "Child"("userId");

-- CreateIndex
CREATE INDEX "Child_childId_idx" ON "Child"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_email_key" ON "AccessRequest"("email");

-- CreateIndex
CREATE INDEX "AccessRequest_status_idx" ON "AccessRequest"("status");

-- CreateIndex
CREATE INDEX "AccessRequest_email_idx" ON "AccessRequest"("email");

-- CreateIndex
CREATE INDEX "AccessRequest_userId_idx" ON "AccessRequest"("userId");

-- CreateIndex
CREATE INDEX "AiUsage_userId_idx" ON "AiUsage"("userId");

-- CreateIndex
CREATE INDEX "AiUsage_dateKey_idx" ON "AiUsage"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsage_actorKey_dateKey_feature_key" ON "AiUsage"("actorKey", "dateKey", "feature");

-- CreateIndex
CREATE INDEX "UploadMaterial_userId_subject_idx" ON "UploadMaterial"("userId", "subject");

-- CreateIndex
CREATE INDEX "UploadMaterial_childId_idx" ON "UploadMaterial"("childId");

-- CreateIndex
CREATE INDEX "UploadMaterial_status_idx" ON "UploadMaterial"("status");

-- CreateIndex
CREATE INDEX "IndexedChunk_userId_subject_idx" ON "IndexedChunk"("userId", "subject");

-- CreateIndex
CREATE INDEX "IndexedChunk_materialId_idx" ON "IndexedChunk"("materialId");

-- CreateIndex
CREATE INDEX "IndexedChunk_childId_idx" ON "IndexedChunk"("childId");

-- CreateIndex
CREATE INDEX "Progress_childId_idx" ON "Progress"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_childId_subject_key" ON "Progress"("userId", "childId", "subject");

-- CreateIndex
CREATE INDEX "QuizResult_userId_idx" ON "QuizResult"("userId");

-- CreateIndex
CREATE INDEX "QuizResult_childId_subject_idx" ON "QuizResult"("childId", "subject");

-- CreateIndex
CREATE INDEX "WeakConcept_userId_idx" ON "WeakConcept"("userId");

-- CreateIndex
CREATE INDEX "WeakConcept_childId_subject_idx" ON "WeakConcept"("childId", "subject");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "AdminAction_adminUserId_idx" ON "AdminAction"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminAction_targetUserId_idx" ON "AdminAction"("targetUserId");

-- CreateIndex
CREATE INDEX "AdminAction_targetRequestId_idx" ON "AdminAction"("targetRequestId");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadMaterial" ADD CONSTRAINT "UploadMaterial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexedChunk" ADD CONSTRAINT "IndexedChunk_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "UploadMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_targetRequestId_fkey" FOREIGN KEY ("targetRequestId") REFERENCES "AccessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
