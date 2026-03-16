import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STUB_DELAY_MS = 500;

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export async function qualityGate(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'QUALITY_GATE' }, 'Starting quality gate');

  if (!ctx.rawOutput) {
    throw new PipelineError('QUALITY_GATE', 'QUALITY_GATE_REJECTED', 'rawOutput is required');
  }

  if (isStubMode()) {
    await new Promise((r) => setTimeout(r, STUB_DELAY_MS));
    const overallScore = 0.88;
    const brandComplianceScore = 0.85;
    const safetyScore = 0.99;
    const passed = overallScore >= 0.65;
    const requiresHumanReview = overallScore >= 0.65 && overallScore < 0.85;

    logger.info({ jobId: ctx.jobId, stage: 'QUALITY_GATE', stub: true, overallScore, passed }, 'Quality gate complete (stub)');
    return {
      ...ctx,
      qualityResult: { passed, overallScore, brandComplianceScore, safetyScore, issues: [], requiresHumanReview },
      currentStage: 'DELIVERY',
      stageTimings: { ...ctx.stageTimings, QUALITY_GATE: Date.now() - start },
    };
  }

  const client = new Anthropic();
  const imageUrl = ctx.rawOutput.outputUrls[0];

  const dnaContext = ctx.dna
    ? `Brand DNA:
- Visual style: ${ctx.dna.visualStyle}
- Mood: ${Array.isArray(ctx.dna.mood) ? ctx.dna.mood.join(', ') : ctx.dna.mood}
- Forbidden elements: ${ctx.dna.forbiddenElements?.join(', ') ?? 'none'}
- Color palette: ${JSON.stringify((ctx.dna as Record<string, unknown>).colorPalette)}`
    : 'No brand DNA.';

  const qualityResult = await withRetry(
    async () => {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: `You are a quality assurance specialist for AI-generated brand media.
Evaluate the provided image against these criteria:
1. Content safety (no harmful, offensive, or inappropriate content)
2. Brand compliance (matches DNA color palette, style, mood)
3. Technical quality (no artifacts, appropriate resolution, correct composition)

${dnaContext}

Return a JSON object with:
- passed: boolean (true if overall score >= 0.65)
- overallScore: number 0-1
- brandComplianceScore: number 0-1
- safetyScore: number 0-1
- issues: string[] (list of any issues found)
- requiresHumanReview: boolean (true if 0.65 <= score < 0.85)

Only output valid JSON, no markdown.`,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: imageUrl } },
              { type: 'text', text: `Original brief: ${ctx.brief.userPrompt}\nPrompt used: ${ctx.generationPrompt?.positivePrompt ?? 'unknown'}` },
            ],
          },
        ],
      });

      const text = response.content.find((b) => b.type === 'text');
      if (!text || text.type !== 'text') {
        throw new PipelineError('QUALITY_GATE', 'QUALITY_GATE_REJECTED', 'No text in response', true);
      }

      return JSON.parse(text.text);
    },
    { maxAttempts: 2, baseDelayMs: 2000 },
  );

  // Enforce routing rules
  if (qualityResult.overallScore < 0.65) {
    qualityResult.passed = false;
    qualityResult.requiresHumanReview = false;
  } else if (qualityResult.overallScore < 0.85) {
    qualityResult.passed = true;
    qualityResult.requiresHumanReview = true;
  } else {
    qualityResult.passed = true;
    qualityResult.requiresHumanReview = false;
  }

  logger.info(
    { jobId: ctx.jobId, stage: 'QUALITY_GATE', ...qualityResult, durationMs: Date.now() - start },
    'Quality gate complete',
  );

  if (!qualityResult.passed) {
    throw new PipelineError('QUALITY_GATE', 'QUALITY_GATE_REJECTED', `Quality score ${qualityResult.overallScore} below threshold`, false);
  }

  return {
    ...ctx,
    qualityResult,
    currentStage: 'DELIVERY',
    stageTimings: { ...ctx.stageTimings, QUALITY_GATE: Date.now() - start },
  };
}
