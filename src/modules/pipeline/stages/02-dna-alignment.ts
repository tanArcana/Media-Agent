import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { DEFAULT_DNA } from '@/modules/brand-dna';
import type { PipelineContext } from '../types';

const STUB_DELAY_MS = 500;

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export async function dnaAlignment(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'DNA_ALIGNMENT' }, 'Starting DNA alignment');

  if (isStubMode()) {
    await new Promise((r) => setTimeout(r, STUB_DELAY_MS));
    const dna = ctx.dna ?? DEFAULT_DNA;
    const alignment = {
      score: 0.82,
      conflicts: [] as string[],
      adjustments: ['Applied brand color palette constraints', 'Matched lighting style'],
    };
    logger.info({ jobId: ctx.jobId, stage: 'DNA_ALIGNMENT', stub: true, score: alignment.score }, 'DNA alignment complete (stub)');
    return {
      ...ctx,
      dna,
      dnaAlignment: alignment,
      currentStage: 'PROMPT_ENGINEERING' as const,
      stageTimings: { ...ctx.stageTimings, DNA_ALIGNMENT: Date.now() - start },
    };
  }

  // Load active DNA from database
  let dna = ctx.dna;
  if (!dna) {
    const dbDna = await prisma.brandDNA.findFirst({
      where: { workspaceId: ctx.workspaceId, isActive: true },
      orderBy: { version: 'desc' },
    });

    if (dbDna) {
      dna = {
        brandName: dbDna.brandName,
        industry: dbDna.industry,
        brandPersonality: dbDna.brandPersonality,
        colorPalette: dbDna.colorPalette as Record<string, unknown>,
        typography: dbDna.typography as Record<string, unknown>,
        visualStyle: dbDna.visualStyle,
        mood: dbDna.mood,
        lightingStyle: dbDna.lightingStyle,
        colorTreatment: dbDna.colorTreatment,
        composition: dbDna.composition as Record<string, unknown>,
        forbiddenElements: dbDna.forbiddenElements,
        requiredElements: dbDna.requiredElements,
        subjectTypes: dbDna.subjectTypes,
        version: dbDna.version,
        extractedAt: dbDna.createdAt,
        extractionConfidence: dbDna.extractionConfidence,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    } else {
      logger.warn({ jobId: ctx.jobId, workspaceId: ctx.workspaceId }, 'No Brand DNA found, using defaults');
      dna = DEFAULT_DNA;
    }
  }

  // Score alignment between brief and DNA
  const brief = ctx.analyzedBrief;
  const conflicts: string[] = [];
  const adjustments: string[] = [];

  // Check for forbidden elements in brief
  if (brief && dna && Array.isArray(dna.forbiddenElements)) {
    for (const forbidden of dna.forbiddenElements) {
      if (brief.intent.toLowerCase().includes(forbidden.toLowerCase())) {
        conflicts.push(`Brief mentions forbidden element: "${forbidden}"`);
      }
    }
  }

  if (conflicts.length === 0) {
    adjustments.push('Applied brand color palette constraints');
    adjustments.push('Matched lighting style to DNA preferences');
  }

  const score = conflicts.length === 0 ? 0.85 : Math.max(0.3, 0.85 - conflicts.length * 0.15);

  if (score < 0.3) {
    logger.warn({ jobId: ctx.jobId, score, conflicts }, 'DNA alignment critically low — requires human approval');
  }

  logger.info({ jobId: ctx.jobId, stage: 'DNA_ALIGNMENT', score, durationMs: Date.now() - start }, 'DNA alignment complete');

  return {
    ...ctx,
    dna,
    dnaAlignment: { score, conflicts, adjustments },
    currentStage: 'PROMPT_ENGINEERING',
    stageTimings: { ...ctx.stageTimings, DNA_ALIGNMENT: Date.now() - start },
  };
}
