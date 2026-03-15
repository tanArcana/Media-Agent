# AEGIS — Claude Code Context

## Docs

Full specs live in /docs/. Read the relevant one before implementing any module:

- @docs/01_PRODUCT_REQUIREMENTS.md — what the product is
- @docs/02_SYSTEM_ARCHITECTURE.md — stack, module structure, data flow
- @docs/03_MEDIA_GENERATION_PIPELINE.md — the 6-stage generation pipeline
- @docs/04_AGENT_ORCHESTRATION.md — agent patterns, tool registry, sub-agents
- @docs/05_BRAND_DNA_SYSTEM.md — DNA schema and generation process
- @docs/06_DATA_MODEL.md — full Prisma schema
- @docs/07_UI_UX_SPEC.md — page map, components, responsive rules
- @docs/08_FILE_STRUCTURE.md — where everything lives
- @docs/09_ENVIRONMENT_SETUP.md — setup, env vars, scripts
- @docs/10_SMALLEST_PR.md — PR sequence and scope
- @docs/11_SCALING_PLAN.md — future scaling strategy
- @docs/12_RISKS_AND_FAILURE_MODES.md — known risks and mitigations

## Rules

- One module per session. Don't try to build everything at once.
- Follow the PR sequence in 10_SMALLEST_PR.md — start with PR 1.
- Import across modules only via index.ts (never deep imports).
- USE_MOCK_PROVIDERS=true during dev unless testing FAL specifically.
- System prompts are TypeScript template literals, not YAML or markdown files.

## How to start each session

When you open Claude Code for a new feature, lead with which PR you're on:

```
We're implementing PR 4 from @docs/10_SMALLEST_PR.md.
Read @docs/03_MEDIA_GENERATION_PIPELINE.md and @docs/04_AGENT_ORCHESTRATION.md
before starting.
```

## Key Conventions

- **TypeScript** throughout — no plain JS files
- **Zod** for all runtime validation (inputs, outputs, tool args)
- **No deep imports** — always import from a module's `index.ts`
- **Mock-first** — every external provider must have a mock implementation
- **Typed errors** — never throw raw strings; use typed error classes
- **Logging** — use the structured logger, not `console.log`
