# AEGIS — System Architecture

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) | React Server Components + Client islands |
| API | Next.js Route Handlers | REST-style, Zod-validated |
| Agent Runtime | Anthropic Claude API (claude-opus-4-6) | Tool-use, streaming |
| Media Generation | FAL.ai | Image & video models |
| Database | PostgreSQL via Prisma | Primary datastore |
| File Storage | AWS S3 (or compatible) | Generated assets, brand files |
| Queue | BullMQ + Redis | Pipeline job queue |
| Auth | Clerk | Multi-tenant, workspace isolation |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| Validation | Zod | All boundaries (API, tools, agents) |
| Testing | Vitest | Unit + integration |
| Deployment | Vercel (frontend) + Railway (workers) | Separate processes |

## Module Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Login, signup flows
│   ├── (dashboard)/            # Main app shell
│   │   ├── workspace/[id]/     # Workspace-scoped pages
│   │   ├── campaigns/          # Campaign management
│   │   └── brand-dna/          # DNA editor
│   └── api/                    # API route handlers
│       ├── pipeline/           # Generation pipeline endpoints
│       ├── dna/                # Brand DNA CRUD
│       └── webhooks/           # FAL + external webhooks
│
├── modules/
│   ├── pipeline/               # 6-stage generation pipeline
│   │   ├── stages/             # One file per stage
│   │   ├── types.ts            # Pipeline-wide types
│   │   └── index.ts            # Public API
│   │
│   ├── agents/                 # Agent definitions and runners
│   │   ├── orchestrator/       # Top-level orchestrator
│   │   ├── prompt-engineer/    # Prompt crafting sub-agent
│   │   ├── quality-gate/       # QA sub-agent
│   │   ├── tools/              # Tool registry
│   │   └── index.ts
│   │
│   ├── brand-dna/              # DNA extraction and storage
│   │   ├── extractor.ts        # AI-powered DNA extraction
│   │   ├── schema.ts           # Zod DNA schema
│   │   ├── validator.ts        # DNA validation
│   │   └── index.ts
│   │
│   ├── media/                  # Media provider abstraction
│   │   ├── providers/          # FAL, mock implementations
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── storage/                # S3 abstraction
│   │   └── index.ts
│   │
│   └── queue/                  # BullMQ job definitions
│       └── index.ts
│
├── lib/                        # Shared utilities
│   ├── logger.ts               # Structured logger (pino)
│   ├── errors.ts               # Typed error classes
│   ├── prisma.ts               # Prisma client singleton
│   └── env.ts                  # Validated env vars (Zod)
│
└── workers/                    # Long-running worker processes
    └── pipeline-worker.ts      # Processes BullMQ jobs
```

## Data Flow

### Generation Request

```
Browser → POST /api/pipeline/generate
         ↓
    Route Handler (validates input, creates DB job record)
         ↓
    BullMQ Queue (enqueues pipeline job)
         ↓
    Pipeline Worker (dequeues, runs orchestrator agent)
         ↓
    Stage 1: Brief Analysis
    Stage 2: DNA Alignment
    Stage 3: Prompt Engineering (sub-agent)
    Stage 4: FAL Generation (media provider)
    Stage 5: Quality Gate (sub-agent)
    Stage 6: Delivery (S3 upload, DB update)
         ↓
    SSE / WebSocket push to browser
```

### Brand DNA Ingestion

```
Browser → POST /api/dna/extract (multipart: brand files)
         ↓
    Route Handler → S3 upload of raw files
         ↓
    DNA Extractor Agent (Claude, tool-use)
         ↓
    Structured DNA (Zod-validated)
         ↓
    Prisma → PostgreSQL (BrandDNA record)
```

## Key Architectural Decisions

### 1. Agents are stateless functions
Agents take typed input, return typed output. No hidden state. Retry is safe.

### 2. Every external provider has a mock
`USE_MOCK_PROVIDERS=true` replaces FAL with a deterministic mock returning fixture images. No surprises in CI.

### 3. Pipeline stages are composable
Each stage is a pure function: `(context: PipelineContext) => Promise<PipelineContext>`. Stages can be tested in isolation.

### 4. Errors are typed
No `throw new Error("something went wrong")`. Use typed classes:
```typescript
class PipelineError extends Error {
  constructor(
    public readonly stage: PipelineStage,
    public readonly code: ErrorCode,
    message: string,
    public readonly cause?: unknown
  ) { super(message); }
}
```

### 5. Multi-tenancy via workspace isolation
Every Prisma query scopes to `workspaceId`. Middleware enforces this automatically.

## Inter-Module Import Rules

- Modules may only import from another module's `index.ts`
- Never: `import { foo } from '@/modules/agents/orchestrator/internal'`
- Always: `import { foo } from '@/modules/agents'`
- Shared utilities in `lib/` are importable by all modules
