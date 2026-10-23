CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityKey" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "scorePercent" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningProgress_studentId_activityKey_key"
ON "LearningProgress"("studentId", "activityKey");

CREATE INDEX "LearningProgress_studentId_completedAt_idx"
ON "LearningProgress"("studentId", "completedAt");

ALTER TABLE "LearningProgress"
ADD CONSTRAINT "LearningProgress_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
