# AEGIS — Data Model

## Overview

AEGIS uses PostgreSQL via Prisma ORM. The schema is multi-tenant with workspace-level isolation enforced at the application layer.

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Workspace & Users ───────────────────────────────────────────────────────

model Workspace {
  id          String   @id @default(cuid())
  clerkOrgId  String   @unique  // Clerk organization ID
  name        String
  slug        String   @unique
  plan        Plan     @default(FREE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  members     WorkspaceMember[]
  brandDnas   BrandDNA[]
  campaigns   Campaign[]
  assets      Asset[]
  jobs        PipelineJob[]

  @@index([clerkOrgId])
}

model WorkspaceMember {
  id          String          @id @default(cuid())
  workspaceId String
  clerkUserId String
  role        WorkspaceRole   @default(MEMBER)
  joinedAt    DateTime        @default(now())

  workspace   Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, clerkUserId])
  @@index([clerkUserId])
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

// ─── Brand DNA ───────────────────────────────────────────────────────────────

model BrandDNA {
  id                  String   @id @default(cuid())
  workspaceId         String
  version             Int      @default(1)
  isActive            Boolean  @default(true)

  // Core DNA fields (stored as JSON for flexibility)
  brandName           String
  industry            String
  brandPersonality    String[]
  colorPalette        Json     // ColorPalette type
  typography          Json     // Typography type
  visualStyle         String
  mood                String[]
  lightingStyle       String
  colorTreatment      String
  composition         Json     // Composition type
  forbiddenElements   String[]
  requiredElements    String[]
  subjectTypes        String[]

  extractionConfidence Float   @default(0)
  extractionJobId     String?  // PipelineJob that produced this DNA

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, version])
  @@index([workspaceId, isActive])
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

model Campaign {
  id          String          @id @default(cuid())
  workspaceId String
  name        String
  description String?
  brief       String?         // High-level campaign brief
  status      CampaignStatus  @default(DRAFT)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  workspace   Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  assets      Asset[]
  jobs        PipelineJob[]

  @@index([workspaceId])
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}

// ─── Assets ──────────────────────────────────────────────────────────────────

model Asset {
  id              String      @id @default(cuid())
  workspaceId     String
  campaignId      String?
  jobId           String?     @unique

  // Asset details
  type            AssetType
  status          AssetStatus @default(PENDING)
  originalUrl     String?     // S3 URL of full-res asset
  thumbnailUrl    String?     // S3 URL of thumbnail
  aspectRatio     String?     // "16:9", "1:1", etc.
  width           Int?
  height          Int?
  durationMs      Int?        // For video assets

  // Generation metadata
  prompt          String?     // The positive prompt used
  negativePrompt  String?
  providerModel   String?     // e.g., "fal-ai/flux/dev"
  brandDnaId      String?     // DNA version used

  // Quality
  brandScore      Float?      // 0-1 brand compliance score
  qualityScore    Float?      // 0-1 overall quality score
  humanReviewed   Boolean     @default(false)
  humanApproved   Boolean?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  workspace       Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  campaign        Campaign?   @relation(fields: [campaignId], references: [id])
  job             PipelineJob? @relation(fields: [jobId], references: [id])

  @@index([workspaceId])
  @@index([campaignId])
}

enum AssetType {
  IMAGE
  VIDEO
}

enum AssetStatus {
  PENDING
  GENERATING
  AWAITING_REVIEW
  APPROVED
  REJECTED
  FAILED
}

// ─── Pipeline Jobs ───────────────────────────────────────────────────────────

model PipelineJob {
  id              String      @id @default(cuid())
  workspaceId     String
  campaignId      String?

  // Job configuration
  type            JobType     @default(GENERATE_ASSET)
  status          JobStatus   @default(QUEUED)
  priority        Int         @default(5)  // 1-10, higher = more priority

  // Input (stored as JSON)
  input           Json

  // Output
  output          Json?
  errorCode       String?
  errorMessage    String?

  // Timing
  queuedAt        DateTime    @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  failedAt        DateTime?

  // Retry tracking
  attemptCount    Int         @default(0)
  maxAttempts     Int         @default(3)
  nextRetryAt     DateTime?

  // Progress
  currentStage    String?
  progressPct     Int?        // 0-100

  workspace       Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  campaign        Campaign?   @relation(fields: [campaignId], references: [id])
  asset           Asset?

  @@index([workspaceId, status])
  @@index([status, nextRetryAt])
}

enum JobType {
  GENERATE_ASSET
  EXTRACT_DNA
  BATCH_GENERATE
}

enum JobStatus {
  QUEUED
  RUNNING
  AWAITING_REVIEW
  COMPLETED
  FAILED
  CANCELLED
}
```

## Key Design Decisions

### 1. JSON columns for complex types
`colorPalette`, `typography`, `composition` in `BrandDNA` are stored as `Json`. This allows the schema to evolve without migrations for nested fields, while the Zod schema in `src/modules/brand-dna/schema.ts` enforces structure at the application layer.

### 2. Soft relationships between Asset and PipelineJob
`Asset.jobId` is optional and unique, allowing assets to be created without a job (e.g., manually uploaded). The `@unique` constraint ensures one job produces at most one asset.

### 3. Workspace isolation
Every model includes `workspaceId`. A Prisma middleware enforces this on reads:

```typescript
// src/lib/prisma.ts
prisma.$use(async (params, next) => {
  const workspaceId = getWorkspaceIdFromContext();
  if (workspaceId && params.model !== 'Workspace') {
    params.args.where = { ...params.args.where, workspaceId };
  }
  return next(params);
});
```

### 4. BrandDNA versioning
The `@@unique([workspaceId, version])` constraint ensures version numbers are unique per workspace. Active DNA is identified by `isActive: true`.

## Migrations

Run migrations with:
```bash
npx prisma migrate dev --name <migration-name>
```

Always review generated SQL before applying to production:
```bash
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```
