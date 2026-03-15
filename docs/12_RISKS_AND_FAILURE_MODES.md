# AEGIS — Risks and Failure Modes

## Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| FAL generation failure | Medium | High | Retry + fallback model |
| Claude API rate limit | Low | High | Token bucket + queue |
| Brand DNA extraction produces low-quality output | Medium | Medium | Confidence scoring + manual edit UI |
| Pipeline job gets stuck | Low | Medium | Job timeout + dead letter queue |
| Content safety bypass | Low | Critical | Multi-layer safety checks |
| Database connection exhaustion | Low | High | Connection pooling (PgBouncer) |
| S3 upload failure | Low | Medium | Retry + local temp storage fallback |
| Worker crash mid-job | Low | Medium | BullMQ job locking + retry |
| Cost overrun (AI API usage) | Medium | Medium | Per-workspace rate limiting |
| Tenant data leak | Very Low | Critical | Workspace middleware + audit log |

---

## Failure Mode Details

### 1. FAL Generation Failure

**Symptoms:** Stage 4 (Generation) returns an error or times out.

**Causes:**
- FAL service outage
- Invalid model parameters
- Content filtered by FAL's safety system
- Timeout (generation > 120s)

**Mitigation:**
1. Retry up to 3 times with exponential backoff
2. On third failure, try a fallback model (e.g., switch from `fal-ai/flux/dev` to `fal-ai/flux/schnell`)
3. If all retries fail, mark job as `FAILED` and notify user via SSE event
4. Log full error context for debugging

**Detection:** Monitor FAL error rate per model. Alert if > 5% error rate over 5 minutes.

---

### 2. Claude API Rate Limiting

**Symptoms:** Agent calls return 429 errors; pipeline stalls.

**Causes:**
- Burst of concurrent jobs hitting Claude API simultaneously
- Insufficient tier for current traffic

**Mitigation:**
1. Implement a token bucket rate limiter in the worker (`src/lib/rate-limiter.ts`)
2. When rate limited, BullMQ job is paused (not failed) and retried after the rate limit resets
3. Upgrade to enterprise tier if sustained throughput > 1000 jobs/day
4. Use claude-haiku-4-5 for less complex tasks to save RPM budget for opus

**Detection:** Log all 429 responses. Alert if > 10 rate limit hits per minute.

---

### 3. Brand DNA Extraction Quality

**Symptoms:** Extracted DNA is imprecise; generated images don't match brand.

**Causes:**
- Brand materials are low-quality (blurry logos, inconsistent examples)
- Insufficient material variety (only one image uploaded)
- Ambiguous brand guidelines (conflicting visual rules)

**Mitigation:**
1. Assign `extractionConfidence` score to every DNA record
2. Show confidence score prominently in the DNA editor UI
3. For confidence < 0.6: warn user and recommend manual review
4. For confidence < 0.4: block generation until DNA is manually verified
5. Allow manual field-by-field override in the DNA editor

**Detection:** Track average `extractionConfidence` per workspace. Surface low-confidence workspaces in admin dashboard.

---

### 4. Pipeline Job Stuck

**Symptoms:** Job remains in `RUNNING` state indefinitely; no progress updates.

**Causes:**
- Worker process crashed mid-job (Docker restart, OOM kill)
- Network issue between worker and FAL/S3
- Agent enters infinite loop (shouldn't happen with `max_tokens` + iteration limits)

**Mitigation:**
1. BullMQ's `lockDuration` setting: if worker doesn't renew lock within 30s, job is returned to queue
2. Job-level timeout: if job has been `RUNNING` for > 10 minutes, a watchdog marks it `FAILED`
3. Implement `MAX_AGENT_ITERATIONS = 20` hard limit in every agent loop

**Detection:** Alert if any job is `RUNNING` for > 5 minutes (expected max: 3 minutes).

---

### 5. Content Safety Bypass

**Symptoms:** A generated image with harmful or policy-violating content reaches the `Delivery` stage.

**Causes:**
- Prompt injection in user brief that circumvents system prompt
- Quality Gate agent misjudges content
- FAL's own safety filter misses something

**Mitigation (defense in depth):**
1. **Input sanitization:** Brief input is sanitized before passing to agents; strip common prompt injection patterns
2. **FAL safety:** FAL applies its own content filtering at generation time
3. **AEGIS Quality Gate:** Claude vision reviews output before delivery
4. **Post-delivery review:** Random sampling of 5% of delivered assets by human reviewers (future)
5. **User reporting:** "Flag content" button on every asset

**Detection:** Human review queue + automated scan. Any flagged asset triggers immediate review.

---

### 6. Database Connection Exhaustion

**Symptoms:** Prisma throws `Error: Too many database connections`.

**Causes:**
- Many worker replicas each holding their own connection pool
- Serverless Next.js functions each creating connections

**Mitigation:**
1. Use PgBouncer in transaction mode between all services and PostgreSQL
2. Configure Prisma connection pool: `connection_limit=5` per worker instance
3. Use `@prisma/client` singleton pattern in workers (not per-request instantiation)

**Detection:** Monitor `pg_stat_activity` connection count. Alert if > 80% of `max_connections`.

---

### 7. S3 Upload Failure

**Symptoms:** Stage 6 (Delivery) fails; asset not stored.

**Causes:**
- Temporary S3 outage
- Network timeout during upload
- Invalid credentials (expired IAM role)
- Bucket permissions change

**Mitigation:**
1. Retry upload up to 3 times with exponential backoff
2. If all retries fail: mark job as `FAILED` with code `STORAGE_FAILED`
3. Raw output URL from FAL is stored in `PipelineJob.output` before upload attempt, enabling manual recovery
4. Alert on IAM credential expiry (rotate every 90 days via automated rotation)

---

### 8. Tenant Data Leak

**Symptoms:** Workspace A can access assets or DNA belonging to Workspace B.

**Causes:**
- Missing `workspaceId` filter in a Prisma query
- Direct S3 URL guessing (if URLs are predictable)
- Clerk auth token accepted for wrong workspace

**Mitigation:**
1. Prisma middleware auto-injects `workspaceId` on all queries (belt)
2. Route handlers explicitly validate that the requesting user is a member of the workspace (suspenders)
3. S3 object keys include a random UUID segment: `workspaces/{id}/assets/{uuid}/...` — not guessable
4. Security test: automated cross-tenant access test in CI (attempts to access asset from different workspace)
5. Audit log: every data access logs `userId`, `workspaceId`, `resourceId`, `action`

**Detection:** Daily automated cross-tenant isolation check. Immediate alert on any anomaly.

---

## Observability

### Logging
All services use Pino structured logging. Every log entry includes:
- `jobId` (for pipeline events)
- `workspaceId`
- `stage` (for pipeline events)
- `durationMs` (for timed operations)

### Metrics (future)
- Job queue depth per priority tier
- Stage success/failure rates
- FAL provider error rate
- P50/P95/P99 generation latency
- Brand compliance score distribution

### Alerting Thresholds
| Signal | Warning | Critical |
|--------|---------|---------|
| Job failure rate | > 5% | > 15% |
| Queue depth | > 100 jobs | > 500 jobs |
| Job stuck duration | > 5 min | > 10 min |
| FAL error rate | > 5% | > 20% |
| DB connection usage | > 70% | > 90% |
| Claude 429 rate | > 10/min | > 50/min |
