# AEGIS — Environment Setup

## Prerequisites

- Node.js 20+ (use `.nvmrc` or `nvm use`)
- PostgreSQL 15+ (local or Docker)
- Redis 7+ (local or Docker, for BullMQ)
- pnpm 9+

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/Media-Agent.git
cd Media-Agent
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see below)

# 3. Set up the database
pnpm db:push        # Apply schema without migration history (dev only)
# OR
pnpm db:migrate     # Apply migrations (recommended)

# 4. Start development server
pnpm dev

# 5. Start the background worker (separate terminal)
pnpm worker
```

## Environment Variables

### `.env.example`

```bash
# ─── Database ──────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:password@localhost:5432/aegis_dev"

# ─── Redis ─────────────────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ─── Auth (Clerk) ──────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# ─── AI (Anthropic) ────────────────────────────────────────────────────────
ANTHROPIC_API_KEY="sk-ant-..."

# ─── Media Generation (FAL) ────────────────────────────────────────────────
FAL_KEY="..."

# ─── Storage (S3) ──────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="aegis-assets"

# ─── App Config ────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ─── Dev Flags ─────────────────────────────────────────────────────────────
# Set to "true" to use mock providers (no FAL costs, no S3 uploads)
USE_MOCK_PROVIDERS="true"
# Fraction (0-1) of mock generation requests to simulate failure
MOCK_PROVIDER_FAIL_RATE="0"

# ─── Logging ───────────────────────────────────────────────────────────────
LOG_LEVEL="info"    # trace | debug | info | warn | error
```

### Validated Env Schema

All environment variables are validated at startup using Zod:

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  FAL_KEY: z.string().optional(), // not required when USE_MOCK_PROVIDERS=true
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  USE_MOCK_PROVIDERS: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  MOCK_PROVIDER_FAIL_RATE: z.coerce.number().min(0).max(1).default(0),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);
```

If any required variable is missing, the app throws at startup with a clear error message.

## npm Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "worker": "tsx src/workers/pipeline-worker.ts",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Docker Compose (Local Infrastructure)

```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: aegis_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Start infrastructure: `docker compose up -d`

## IDE Setup

### VS Code Extensions (recommended)
- Prisma (syntax highlighting for .prisma files)
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### Settings (`/.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Running Tests

```bash
# Run all tests (uses USE_MOCK_PROVIDERS=true automatically)
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Run a specific test file
pnpm test src/modules/agents/prompt-engineer/prompt-engineer.test.ts

# Run with coverage report
pnpm test:coverage
```

Tests that make agent calls mock the Anthropic SDK — no API costs in CI.

## Seeding Development Data

```bash
# Create a test workspace with Brand DNA and sample assets
pnpm tsx prisma/seed.ts
```

The seed script creates:
- 1 workspace: "Acme Corp" (slug: `acme-corp`)
- Brand DNA with a warm, minimalist coffee brand identity
- 3 campaigns with 10 sample assets each
- All assets reference fixture images from `public/fixtures/`
