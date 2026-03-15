# AEGIS — File Structure

## Root

```
Media-Agent/
├── CLAUDE.md                   # Claude Code context (rules, doc references)
├── README.md                   # Project overview and quick start
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── .env.example
├── .env.local                  # Local secrets (gitignored)
├── .gitignore
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
│
├── docs/                       # Project documentation (this folder)
│   ├── 01_PRODUCT_REQUIREMENTS.md
│   ├── 02_SYSTEM_ARCHITECTURE.md
│   ├── 03_MEDIA_GENERATION_PIPELINE.md
│   ├── 04_AGENT_ORCHESTRATION.md
│   ├── 05_BRAND_DNA_SYSTEM.md
│   ├── 06_DATA_MODEL.md
│   ├── 07_UI_UX_SPEC.md
│   ├── 08_FILE_STRUCTURE.md
│   ├── 09_ENVIRONMENT_SETUP.md
│   ├── 10_SMALLEST_PR.md
│   ├── 11_SCALING_PLAN.md
│   └── 12_RISKS_AND_FAILURE_MODES.md
│
├── public/                     # Static assets
│   └── fixtures/               # Fixture images for mock provider
│
└── src/
    ├── app/                    # Next.js App Router
    ├── modules/                # Feature modules
    ├── components/             # React components
    ├── hooks/                  # React hooks
    ├── lib/                    # Shared utilities
    └── workers/                # Background worker processes
```

## `src/app/` — Next.js App Router

```
src/app/
├── layout.tsx                  # Root layout (Clerk provider, fonts)
├── page.tsx                    # Landing page (/)
├── globals.css
│
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
├── onboarding/
│   └── page.tsx
│
├── workspace/[workspaceId]/
│   ├── layout.tsx              # Workspace shell (sidebar, nav)
│   ├── dashboard/page.tsx
│   ├── generate/page.tsx
│   ├── campaigns/
│   │   ├── page.tsx
│   │   └── [campaignId]/
│   │       ├── page.tsx
│   │       └── generate/page.tsx
│   ├── brand-dna/
│   │   ├── page.tsx
│   │   ├── edit/page.tsx
│   │   └── upload/page.tsx
│   ├── assets/
│   │   ├── page.tsx
│   │   └── [assetId]/page.tsx
│   └── settings/
│       ├── workspace/page.tsx
│       ├── members/page.tsx
│       └── billing/page.tsx
│
└── api/
    ├── pipeline/
    │   ├── generate/route.ts       # POST — create pipeline job
    │   └── jobs/
    │       ├── [jobId]/route.ts    # GET — job status
    │       └── [jobId]/stream/route.ts  # GET — SSE stream
    ├── dna/
    │   ├── route.ts               # GET list, POST create
    │   ├── [dnaId]/route.ts       # GET, PATCH, DELETE
    │   └── extract/route.ts       # POST — trigger extraction
    ├── assets/
    │   ├── route.ts               # GET list
    │   └── [assetId]/route.ts     # GET, DELETE, PATCH (approve/reject)
    ├── campaigns/
    │   ├── route.ts               # GET, POST
    │   └── [campaignId]/route.ts  # GET, PATCH, DELETE
    └── webhooks/
        └── fal/route.ts           # FAL generation callbacks
```

## `src/modules/` — Feature Modules

```
src/modules/
│
├── pipeline/                   # 6-stage generation pipeline
│   ├── stages/
│   │   ├── 01-brief-analysis.ts
│   │   ├── 02-dna-alignment.ts
│   │   ├── 03-prompt-engineering.ts
│   │   ├── 04-generation.ts
│   │   ├── 05-quality-gate.ts
│   │   └── 06-delivery.ts
│   ├── pipeline.ts             # Composes stages, handles retries
│   ├── types.ts                # PipelineContext, PipelineError, etc.
│   └── index.ts                # Public API: runPipeline, PipelineContext
│
├── agents/                     # Agent definitions
│   ├── orchestrator/
│   │   ├── orchestrator.ts
│   │   ├── orchestrator.test.ts
│   │   └── index.ts
│   ├── prompt-engineer/
│   │   ├── prompt-engineer.ts
│   │   ├── prompt-engineer.test.ts
│   │   └── index.ts
│   ├── quality-gate/
│   │   ├── quality-gate.ts
│   │   ├── quality-gate.test.ts
│   │   └── index.ts
│   ├── dna-extractor/
│   │   ├── dna-extractor.ts
│   │   ├── dna-extractor.test.ts
│   │   └── index.ts
│   ├── tools/                  # Shared tool implementations
│   │   ├── load-brand-dna.ts
│   │   ├── generate-media.ts
│   │   ├── analyze-image.ts
│   │   ├── store-asset.ts
│   │   ├── update-job-status.ts
│   │   └── index.ts
│   └── index.ts
│
├── brand-dna/                  # DNA extraction and management
│   ├── schema.ts               # Zod BrandDNA schema
│   ├── extractor.ts            # Calls DNA extractor agent
│   ├── validator.ts            # DNA validation helpers
│   ├── defaults.ts             # DEFAULT_DNA constant
│   └── index.ts
│
├── media/                      # Media provider abstraction
│   ├── providers/
│   │   ├── fal.ts              # FAL.ai implementation
│   │   ├── mock.ts             # Mock implementation
│   │   └── index.ts            # Factory: picks provider based on env
│   ├── types.ts
│   └── index.ts
│
├── storage/                    # S3 abstraction
│   ├── s3.ts
│   ├── mock-storage.ts
│   └── index.ts
│
└── queue/                      # BullMQ job definitions
    ├── pipeline-queue.ts
    ├── job-types.ts
    └── index.ts
```

## `src/components/` — React Components

```
src/components/
├── ui/                         # shadcn/ui components (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── layout/                     # Shell components
│   ├── sidebar.tsx
│   ├── top-nav.tsx
│   └── workspace-switcher.tsx
│
├── assets/
│   ├── asset-card.tsx
│   ├── asset-grid.tsx
│   └── asset-detail.tsx
│
├── generation/
│   ├── generation-form.tsx
│   └── pipeline-progress.tsx
│
└── brand-dna/
    ├── dna-color-picker.tsx
    ├── dna-tag-input.tsx
    └── dna-overview.tsx
```

## `src/lib/` — Shared Utilities

```
src/lib/
├── prisma.ts                   # Prisma client singleton + workspace middleware
├── logger.ts                   # Pino structured logger
├── errors.ts                   # Typed error base classes
├── env.ts                      # Zod-validated environment variables
└── utils.ts                    # cn() and other misc helpers
```

## `src/workers/` — Background Processes

```
src/workers/
└── pipeline-worker.ts          # BullMQ worker: dequeues and runs pipeline jobs
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `brand-dna-editor.tsx` |
| React components | PascalCase (exported) | `BrandDNAEditor` |
| Functions | camelCase | `runPipeline` |
| Types/Interfaces | PascalCase | `PipelineContext` |
| Zod schemas | PascalCase + `Schema` | `BrandDNASchema` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_DNA` |
| Env vars | SCREAMING_SNAKE_CASE | `ANTHROPIC_API_KEY` |
