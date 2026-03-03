-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "positionApplied" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NUEVO',
    "notesAdmin" TEXT,
    "restaurantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationInterview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completionTimeSeconds" INTEGER,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalInterview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "adminObservations" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "conductedAt" TIMESTAMP(3),
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEvaluation" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewId" TEXT,
    "personalInterviewId" TEXT,
    "evaluationType" TEXT NOT NULL DEFAULT 'ONLINE',
    "modelVersion" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "attitudeScore" INTEGER NOT NULL,
    "responsibilityScore" INTEGER NOT NULL,
    "technicalScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "suggestedDecision" TEXT NOT NULL,
    "redFlags" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminDecision" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRestaurant" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,

    CONSTRAINT "AdminRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "cedulaNumber" TEXT,
    "restaurantId" TEXT,
    "onboardingToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVO',
    "contractType" TEXT,
    "preferredShifts" TEXT,
    "priorityScore" INTEGER NOT NULL DEFAULT 50,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 50,
    "totalWorkPeriods" INTEGER NOT NULL DEFAULT 0,
    "hireDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "adminNotes" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPeriod" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contractType" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workPeriodId" TEXT NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "attitude" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL,
    "reliability" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "wouldRehire" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRestaurant_adminUserId_restaurantId_key" ON "AdminRestaurant"("adminUserId", "restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_candidateId_key" ON "Employee"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_onboardingToken_key" ON "Employee"("onboardingToken");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReview_workPeriodId_key" ON "PerformanceReview"("workPeriodId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationInterview" ADD CONSTRAINT "ApplicationInterview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalInterview" ADD CONSTRAINT "PersonalInterview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEvaluation" ADD CONSTRAINT "AIEvaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEvaluation" ADD CONSTRAINT "AIEvaluation_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "ApplicationInterview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEvaluation" ADD CONSTRAINT "AIEvaluation_personalInterviewId_fkey" FOREIGN KEY ("personalInterviewId") REFERENCES "PersonalInterview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRestaurant" ADD CONSTRAINT "AdminRestaurant_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRestaurant" ADD CONSTRAINT "AdminRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPeriod" ADD CONSTRAINT "WorkPeriod_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPeriod" ADD CONSTRAINT "WorkPeriod_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_workPeriodId_fkey" FOREIGN KEY ("workPeriodId") REFERENCES "WorkPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

