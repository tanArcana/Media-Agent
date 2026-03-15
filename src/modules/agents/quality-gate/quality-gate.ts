import type { BrandDNA } from '@/modules/brand-dna';
import type { QualityResult, MediaType } from '@/modules/pipeline/types';
import { logger } from '@/lib/logger';
import { runAgent } from '../runner';
import { getToolsForAgent } from '../tools';
import { AgentError } from '../types';

export interface QualityGateInput {
  imageUrl: string;
  dna: BrandDNA;
  mediaType: MediaType;
  originalPrompt: string;
}

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

function buildStubResult(): QualityResult {
  return {
    passed: true,
    overallScore: 0.87,
    brandComplianceScore: 0.82,
    safetyScore: 0.98,
    issues: [],
    requiresHumanReview: false,
  };
}

export async function runQualityGate(
  input: QualityGateInput,
): Promise<QualityResult> {
  const useStubs = process.env.USE_STUBS !== 'false';

  if (useStubs) {
    logger.info('Quality gate running in stub mode');
    return buildStubResult();
  }

  const tools = getToolsForAgent(['analyze_image']);
  const result = await runAgent(
    {
      name: 'quality-gate',
      systemPrompt: buildSystemPrompt(input),
      tools,
    },
    input,
  );

  try {
    return JSON.parse(result.text) as QualityResult;
  } catch (err) {
    throw new AgentError(
      'quality-gate',
      'OUTPUT_PARSE_FAILED',
      'Failed to parse quality gate output as JSON',
      false,
      err,
    );
  }
}
