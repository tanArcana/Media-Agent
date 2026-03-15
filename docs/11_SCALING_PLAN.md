# AEGIS — Scaling Plan

## Current Architecture (v1 Baseline)

The v1 architecture is optimized for correctness and developer velocity, not raw throughput. It runs on:
- Vercel (Next.js frontend + API routes)
- Railway (BullMQ workers)
- Supabase or Railway PostgreSQL
- Upstash Redis

This handles ~50 concurrent generation jobs comfortably.

---

## Scaling Dimensions

### 1. Job Throughput (more concurrent generations)

**Current bottleneck:** Single worker process, single BullMQ queue.

**Path to 10x throughput:**
- Scale worker replicas horizontally (Railway or ECS)
- BullMQ supports multiple concurrent workers out of the box
- Add priority queues: `pipeline:high`, `pipeline:default`, `pipeline:batch`
- Rate-limit per workspace to prevent one tenant starving others

```typescript
// Worker concurrency config
const worker = new Worker('pipeline', processJob, {
  connection: redis,
  concurrency: 10, // process up to 10 jobs simultaneously per worker instance
});
```

**Path to 100x throughput:**
- Dedicated worker fleet per region (US, EU, APAC)
- FAL handles the actual generation load (no action needed on our end for that part)
- Use job deduplication to prevent duplicate submissions

---

### 2. Database (more workspaces, more assets)

**Current state:** Single PostgreSQL instance, all queries scope to `workspaceId`.

**Scaling steps:**

1. **Read replicas** — Route all read queries (`SELECT`) to replica, writes to primary. Prisma datasource routing:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DATABASE_URL_READ")
   }
   ```

2. **Table partitioning** — Partition `Asset` and `PipelineJob` tables by `workspaceId` or date range when rows exceed 50M.

3. **Sharding (if needed)** — At 1B+ assets: shard by `workspaceId` hash across multiple PostgreSQL clusters. Requires workspace-aware connection routing (PgBouncer + custom middleware).

---

### 3. Storage (asset volume)

**Current state:** Single S3 bucket with prefix-based isolation.

**Scaling steps:**
- Enable S3 Transfer Acceleration for global workspaces
- Add CloudFront CDN in front of S3 for thumbnail delivery
- Set S3 lifecycle rules: compress assets older than 90 days to Glacier
- At 10TB+: separate buckets per region for data residency compliance

---

### 4. Agent Calls (Anthropic API usage)

**Current state:** Every generation job makes 3-5 Claude API calls (brief analysis, prompt engineering, quality gate).

**Cost optimization:**
- Cache quality gate results by image hash (avoid re-reviewing the same image)
- Cache prompt engineering output for identical brief+DNA combinations (LRU cache, 1h TTL)
- Use claude-haiku-4-5 for brief analysis (simpler task); keep opus for prompt engineering and QA

**Throughput:**
- Anthropic rate limits apply per API key; enterprise tier supports much higher RPM
- For batch campaigns, implement a token bucket to smooth out request bursts

---

### 5. Real-time Updates (SSE)

**Current state:** SSE connection per job, routed through Next.js API route.

**Scaling limitation:** SSE connections are stateful; they don't work well behind stateless load balancers unless sticky sessions are enabled.

**Path forward:**
- Use Ably or Pusher for real-time events instead of raw SSE (handles connection state externally)
- Or: route all SSE through a dedicated WebSocket server (separate Railway service)
- Emit events from the worker via Redis pub/sub; the SSE server subscribes and forwards to clients

---

### 6. Multi-region

**Phase 1 (current):** Single region (us-east-1).

**Phase 2 (>500 workspaces, or EU compliance required):**
- Deploy Next.js + workers in EU region
- Route workspaces to their home region based on org creation location
- PostgreSQL read replica in EU; writes still go to primary in US
- FAL has multi-region support — configure region affinity

**Phase 3 (global enterprise):**
- Full active-active with global data sovereignty compliance
- Workspace data never leaves the declared home region
- Requires: regional PostgreSQL primaries, cross-region event sync (Kafka or similar)

---

## Performance Benchmarks & Targets

| Metric | v1 Target | v2 Target | v3 Target |
|--------|-----------|-----------|-----------|
| Concurrent jobs | 50 | 500 | 5,000 |
| P95 image generation latency | 30s | 25s | 20s |
| API P95 response time | 200ms | 150ms | 100ms |
| Assets per workspace | 10K | 100K | Unlimited |
| Uptime SLA | 99% | 99.5% | 99.9% |

---

## Things We're NOT Optimizing Prematurely

- Database sharding (handle at 100M+ assets, not before)
- Custom inference infrastructure (FAL handles this)
- Multi-region writes (handle at enterprise tier, not v1)
- Message queue migration from BullMQ (scale BullMQ much further before switching)
