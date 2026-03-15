# AEGIS — Agent Orchestration

## Overview

AEGIS uses Claude as its agent runtime. Agents are TypeScript functions that call Claude with tool-use enabled. There is one top-level **Orchestrator** agent and multiple **sub-agents** that handle specialist tasks.

All agents are stateless: they receive typed input, call Claude (with optional tools), and return typed output. No agent stores state between calls.

## Agent Architecture

```
Orchestrator Agent
├── Calls tools to coordinate pipeline stages
├── Delegates to sub-agents for complex tasks
│   ├── Prompt Engineer Sub-Agent
│   ├── Quality Gate Sub-Agent
│   └── DNA Extractor Sub-Agent
└── Reports progress back to the queue worker
```

## Agent Pattern

Every agent follows the same structure:

```typescript
// src/modules/agents/[name]/index.ts

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic(); // uses ANTHROPIC_API_KEY from env

// Input/output schemas
const InputSchema = z.object({ ... });
const OutputSchema = z.object({ ... });

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

// System prompt (TypeScript template literal, NOT yaml/markdown file)
function buildSystemPrompt(input: Input): string {
  return `You are a specialist agent for...

  Context:
  - Media type: ${input.mediaType}
  - Workspace ID: ${input.workspaceId}
  `;
}

// Tool definitions
const tools: Anthropic.Tool[] = [
  {
    name: 'tool_name',
    description: 'What this tool does',
    input_schema: {
      type: 'object',
      properties: { ... },
      required: [...],
    },
  },
];

// Tool handler
async function handleToolCall(
  toolName: string,
  toolInput: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'tool_name':
      return await someExternalOperation(toolInput);
    default:
      throw new AgentError(`Unknown tool: ${toolName}`);
  }
}

// Main agent function
export async function runAgent(input: Input): Promise<Output> {
  const validatedInput = InputSchema.parse(input);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: JSON.stringify(validatedInput) }
  ];

  // Agentic loop
  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: buildSystemPrompt(validatedInput),
      tools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      // Extract and validate final output
      const text = response.content.find(b => b.type === 'text')?.text ?? '';
      return OutputSchema.parse(JSON.parse(text));
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        const result = await handleToolCall(block.name, block.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }
}
```

## Tool Registry

Tools are defined in `src/modules/agents/tools/` and registered per-agent as needed. Common tools:

### `load_brand_dna`
Loads Brand DNA for a given workspace from the database.
```typescript
{
  name: 'load_brand_dna',
  input: { workspaceId: string },
  output: BrandDNA,
}
```

### `score_brand_alignment`
Given a prompt and a BrandDNA, returns an alignment score and list of conflicts.
```typescript
{
  name: 'score_brand_alignment',
  input: { prompt: string; dna: BrandDNA },
  output: { score: number; conflicts: string[]; adjustments: string[] },
}
```

### `generate_media`
Submits a generation request to the active media provider (FAL or mock).
```typescript
{
  name: 'generate_media',
  input: { prompt: string; negativePrompt: string; params: GenerationParams },
  output: { jobId: string; outputUrls: string[] },
}
```

### `analyze_image`
Runs Claude vision on an image URL and returns structured analysis.
```typescript
{
  name: 'analyze_image',
  input: { imageUrl: string; analysisPrompt: string },
  output: { analysis: string; structuredData?: Record<string, unknown> },
}
```

### `store_asset`
Uploads a media file to S3 and creates a database record.
```typescript
{
  name: 'store_asset',
  input: { url: string; workspaceId: string; campaignId?: string; metadata: AssetMetadata },
  output: { assetId: string; storedUrl: string; thumbnailUrl: string },
}
```

### `update_job_status`
Updates the pipeline job status and emits a progress event.
```typescript
{
  name: 'update_job_status',
  input: { jobId: string; status: JobStatus; progress?: number; message?: string },
  output: { success: boolean },
}
```

## Sub-Agents

### Prompt Engineer Sub-Agent

**Location:** `src/modules/agents/prompt-engineer/`

**Responsibility:** Transform structured brief + DNA into an optimized generation prompt.

**System prompt template:**
```typescript
function buildSystemPrompt(input: PromptEngineerInput): string {
  return `You are an expert AI image/video prompt engineer specializing in brand-consistent media generation.

Your task is to craft a precise generation prompt that:
1. Captures the user's creative intent
2. Enforces the brand's visual DNA constraints
3. Maximizes output quality for the ${input.mediaType} format

Brand DNA Summary:
- Colors: ${input.dna.colorPalette.primary.join(', ')}
- Style: ${input.dna.visualStyle}
- Mood: ${input.dna.mood}
- Forbidden elements: ${input.dna.forbiddenElements.join(', ')}

Output a JSON object with: positivePrompt, negativePrompt, styleModifiers, technicalParams.`;
}
```

**Tools available:** `score_brand_alignment`

---

### Quality Gate Sub-Agent

**Location:** `src/modules/agents/quality-gate/`

**Responsibility:** Evaluate generated media for brand compliance and content safety.

**System prompt template:**
```typescript
function buildSystemPrompt(input: QualityGateInput): string {
  return `You are a quality assurance specialist for AI-generated brand media.

Evaluate the provided image/video against these criteria:
1. Content safety (no harmful, offensive, or inappropriate content)
2. Brand compliance (matches DNA color palette, style, mood)
3. Technical quality (no artifacts, appropriate resolution, correct composition)

Brand DNA:
${JSON.stringify(input.dna, null, 2)}

Return a JSON object with: passed, overallScore, brandComplianceScore, safetyScore, issues[], requiresHumanReview.`;
}
```

**Tools available:** `analyze_image`

---

### DNA Extractor Sub-Agent

**Location:** `src/modules/agents/dna-extractor/`

**Responsibility:** Analyze uploaded brand files (logos, style guides, example images) and extract structured Brand DNA.

**System prompt template:**
```typescript
function buildSystemPrompt(): string {
  return `You are a brand identity expert and visual analyst.

Your task is to analyze uploaded brand materials and extract a structured Brand DNA object.

Analyze:
- Color palette (primary, secondary, accent, forbidden)
- Typography style (if discernible)
- Visual style keywords
- Mood and tone
- Recurring compositional patterns
- Elements to avoid

Return a valid BrandDNA JSON object matching the provided schema.`;
}
```

**Tools available:** `analyze_image`

## Error Handling in Agents

Agents use typed errors:

```typescript
export class AgentError extends Error {
  constructor(
    public readonly agentName: string,
    public readonly code: AgentErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export type AgentErrorCode =
  | 'MAX_ITERATIONS_EXCEEDED'
  | 'INVALID_OUTPUT'
  | 'TOOL_CALL_FAILED'
  | 'CLAUDE_API_ERROR'
  | 'OUTPUT_PARSE_FAILED';
```

## Testing Agents

Each agent has:
1. A unit test mocking the Anthropic client (`src/modules/agents/[name]/[name].test.ts`)
2. An integration test using `USE_MOCK_PROVIDERS=true` that runs the full agent loop

```typescript
// Example mock
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify(mockOutput) }],
      }),
    };
  },
}));
```
