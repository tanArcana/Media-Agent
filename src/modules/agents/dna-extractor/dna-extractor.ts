import { DEFAULT_DNA, type BrandDNA } from '@/modules/brand-dna';
import { logger } from '@/lib/logger';
import { runAgent } from '../runner';
import { getToolsForAgent } from '../tools';
import { AgentError } from '../types';

export interface DNAExtractorInput {
  workspaceId: string;
  brandName: string;
  materialUrls: string[];
}

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

function buildStubResult(input: DNAExtractorInput): BrandDNA {
  return {
    ...DEFAULT_DNA,
    brandName: input.brandName,
    extractedAt: new Date(),
    extractionConfidence: 0.75,
  };
}

export async function runDNAExtractor(
  input: DNAExtractorInput,
): Promise<BrandDNA> {
  const stubMode = process.env.USE_STUBS !== 'false';

  if (stubMode) {
    logger.info('DNA extractor running in stub mode');
    return buildStubResult(input);
  }

  const tools = getToolsForAgent(['analyze_image']);
  const result = await runAgent(
    {
      name: 'dna-extractor',
      systemPrompt: buildSystemPrompt(),
      tools,
    },
    input,
  );

  try {
    return JSON.parse(result.text) as BrandDNA;
  } catch (err) {
    throw new AgentError(
      'dna-extractor',
      'OUTPUT_PARSE_FAILED',
      'Failed to parse DNA extractor output as JSON',
      false,
      err,
    );
  }
}
