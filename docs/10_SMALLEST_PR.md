# AEGIS — PR Sequence (Smallest Shippable PRs)

## Philosophy

Each PR is the smallest possible unit that:
1. Can be reviewed independently
2. Passes all tests
3. Doesn't break existing functionality
4. Moves the system meaningfully toward the full product

Build bottom-up: infrastructure first, then agents, then pipeline, then UI.

---

## PR 1 — Project Scaffold & Shared Infrastructure

**Goal:** Get the skeleton compiling with all dependencies installed and shared utilities in place.

**Scope:**
- `package.json` with all dependencies
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`
- `prisma/schema.prisma` (full schema from doc 06)
- `src/lib/env.ts` — validated env vars
- `src/lib/prisma.ts` — Prisma client singleton with workspace middleware
- `src/lib/logger.ts` — Pino structured logger
- `src/lib/errors.ts` — base typed error classes
- `.env.example`
- `docker-compose.yml`
- Basic `README.md`

**Tests:** `src/lib/env.test.ts` — validates env parsing with valid and invalid inputs

**Done when:** `pnpm build` succeeds, `pnpm test` passes, Prisma client generates cleanly.

---

## PR 2 — Brand DNA Module

**Goal:** Define the DNA schema, defaults, and validation logic.

**Scope:**
- `src/modules/brand-dna/schema.ts` — full Zod BrandDNA schema
- `src/modules/brand-dna/defaults.ts` — DEFAULT_DNA constant
- `src/modules/brand-dna/validator.ts` — DNA validation helpers
- `src/modules/brand-dna/index.ts` — public exports

**Tests:**
- `src/modules/brand-dna/schema.test.ts` — validates valid and invalid DNA objects
- `src/modules/brand-dna/validator.test.ts` — tests validator helpers

**Done when:** All tests pass. No agent code yet — just the schema and types.

---

## PR 3 — Media Provider Abstraction + Mock

**Goal:** Implement the media provider interface with a fully working mock.

**Scope:**
- `src/modules/media/types.ts` — `MediaProvider` interface, request/response types
- `src/modules/media/providers/mock.ts` — mock provider (returns fixture images, fake delay)
- `src/modules/media/providers/fal.ts` — FAL provider stub (not called unless `USE_MOCK_PROVIDERS=false`)
- `src/modules/media/providers/index.ts` — factory based on env
- `src/modules/media/index.ts`
- `public/fixtures/` — 5 sample fixture images (1:1, 16:9, 9:16 formats)

**Tests:**
- `src/modules/media/providers/mock.test.ts` — tests mock returns fixture, respects fail rate
- `src/modules/media/providers/index.test.ts` — factory picks correct provider

**Done when:** `USE_MOCK_PROVIDERS=true` generates a mock image in < 1s.

---

## PR 4 — Agent Infrastructure + Prompt Engineer Sub-Agent

**Goal:** Implement the agent runner pattern and the first working sub-agent.

**Scope:**
- `src/modules/agents/tools/` — all tool implementations (load-brand-dna, generate-media, analyze-image, store-asset, update-job-status)
- `src/modules/agents/prompt-engineer/prompt-engineer.ts` — full agent
- `src/modules/agents/prompt-engineer/prompt-engineer.test.ts`
- `src/modules/agents/index.ts`

**Tests:** Mock Anthropic SDK; verify agent returns valid `generationPrompt` object.

**Done when:** Prompt engineer agent converts a brief + DNA into a valid generation prompt in tests.

---

## PR 5 — Quality Gate Sub-Agent

**Goal:** Implement the quality gate that evaluates generated images.

**Scope:**
- `src/modules/agents/quality-gate/quality-gate.ts`
- `src/modules/agents/quality-gate/quality-gate.test.ts`

**Tests:** Mock Anthropic SDK + vision response; verify scoring logic and routing rules.

**Done when:** Quality gate correctly routes images to approve/review/reject based on mock scores.

---

## PR 6 — DNA Extractor Sub-Agent

**Goal:** Implement the agent that extracts Brand DNA from uploaded brand materials.

**Scope:**
- `src/modules/agents/dna-extractor/dna-extractor.ts`
- `src/modules/agents/dna-extractor/dna-extractor.test.ts`

**Tests:** Mock Anthropic SDK + image analysis; verify output is a valid `BrandDNA`.

**Done when:** Agent returns a valid, Zod-validated BrandDNA from mock brand material inputs.

---

## PR 7 — Storage Module

**Goal:** Implement S3 storage with a mock for dev.

**Scope:**
- `src/modules/storage/s3.ts`
- `src/modules/storage/mock-storage.ts` — in-memory or local filesystem storage
- `src/modules/storage/index.ts` — factory

**Tests:** `mock-storage.test.ts` — upload, retrieve, delete.

**Done when:** Mock storage correctly stores and retrieves files by key.

---

## PR 8 — Pipeline Implementation

**Goal:** Wire all 6 stages into a working pipeline.

**Scope:**
- `src/modules/pipeline/types.ts`
- `src/modules/pipeline/stages/01-brief-analysis.ts` through `06-delivery.ts`
- `src/modules/pipeline/pipeline.ts` — composes stages, handles errors and retries
- `src/modules/pipeline/index.ts`

**Tests:**
- `src/modules/pipeline/pipeline.test.ts` — end-to-end pipeline with all mocks
- One test per stage

**Done when:** `runPipeline(context)` succeeds end-to-end with mocks; all stages covered.

---

## PR 9 — BullMQ Queue + Worker

**Goal:** Run the pipeline asynchronously via job queue.

**Scope:**
- `src/modules/queue/pipeline-queue.ts`
- `src/modules/queue/job-types.ts`
- `src/modules/queue/index.ts`
- `src/workers/pipeline-worker.ts`

**Tests:** Integration test with a real Redis connection (or ioredis-mock).

**Done when:** Enqueuing a job triggers the worker, which runs the pipeline to completion.

---

## PR 10 — API Routes (Pipeline + Assets)

**Goal:** Expose the pipeline and asset management via HTTP.

**Scope:**
- `src/app/api/pipeline/generate/route.ts`
- `src/app/api/pipeline/jobs/[jobId]/route.ts`
- `src/app/api/pipeline/jobs/[jobId]/stream/route.ts` (SSE)
- `src/app/api/assets/route.ts`
- `src/app/api/assets/[assetId]/route.ts`

**Tests:** `src/app/api/pipeline/generate/route.test.ts` — mocks queue, verifies response shape.

**Done when:** `POST /api/pipeline/generate` enqueues a job and returns `{ jobId }`.

---

## PR 11 — DNA API Routes + Extractor Endpoint

**Goal:** Expose Brand DNA CRUD and the extraction trigger.

**Scope:**
- `src/app/api/dna/route.ts`
- `src/app/api/dna/[dnaId]/route.ts`
- `src/app/api/dna/extract/route.ts`
- `src/app/api/webhooks/fal/route.ts`

**Done when:** Full DNA CRUD works via API with auth.

---

## PR 12 — App Shell + Dashboard UI

**Goal:** Next.js app shell with working layout, auth, and dashboard page.

**Scope:**
- `src/app/layout.tsx`
- `src/app/workspace/[workspaceId]/layout.tsx` (sidebar, nav)
- `src/app/workspace/[workspaceId]/dashboard/page.tsx`
- `src/components/layout/` — sidebar, top-nav, workspace-switcher
- Clerk auth integration

**Done when:** Authenticated users see a dashboard with sidebar navigation.

---

## PR 13 — Generation UI

**Goal:** The generate page with form, submission, and live progress.

**Scope:**
- `src/app/workspace/[workspaceId]/generate/page.tsx`
- `src/components/generation/generation-form.tsx`
- `src/components/generation/pipeline-progress.tsx`
- `src/hooks/use-job-stream.ts`

**Done when:** Submitting the form triggers generation; the progress panel updates in real time.

---

## PR 14 — Brand DNA UI

**Goal:** Upload and edit Brand DNA in the UI.

**Scope:**
- `src/app/workspace/[workspaceId]/brand-dna/` pages
- `src/components/brand-dna/` components

**Done when:** Users can upload brand files and see extracted DNA; edit and save works.

---

## PR 15 — Asset Library UI

**Goal:** Browse, filter, and review generated assets.

**Scope:**
- `src/app/workspace/[workspaceId]/assets/` pages
- `src/components/assets/` components

**Done when:** Asset grid loads, asset detail shows quality scores, approve/reject works.

---

## Current Status

| PR | Title | Status |
|----|-------|--------|
| 1  | Scaffold & Infrastructure | 🔲 Not started |
| 2  | Brand DNA Module | 🔲 Not started |
| 3  | Media Provider + Mock | 🔲 Not started |
| 4  | Agent Infrastructure + Prompt Engineer | 🔲 Not started |
| 5  | Quality Gate Agent | 🔲 Not started |
| 6  | DNA Extractor Agent | 🔲 Not started |
| 7  | Storage Module | 🔲 Not started |
| 8  | Pipeline Implementation | 🔲 Not started |
| 9  | Queue + Worker | 🔲 Not started |
| 10 | Pipeline & Asset API Routes | 🔲 Not started |
| 11 | DNA API Routes | 🔲 Not started |
| 12 | App Shell + Dashboard | 🔲 Not started |
| 13 | Generation UI | 🔲 Not started |
| 14 | Brand DNA UI | 🔲 Not started |
| 15 | Asset Library UI | 🔲 Not started |
