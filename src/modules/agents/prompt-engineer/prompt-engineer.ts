import type { BrandDNA } from '@/modules/brand-dna';
import type { AnalyzedBrief, GenerationPrompt, MediaType } from '@/modules/pipeline/types';
import { logger } from '@/lib/logger';
import { runAgent } from '../runner';
import { getToolsForAgent } from '../tools';
import { AgentError } from '../types';

export interface PromptEngineerInput {
  analyzedBrief: AnalyzedBrief;
  dna: BrandDNA;
  mediaType: MediaType;
  aspectRatio: string;
}

function buildSystemPrompt(input: PromptEngineerInput): string {
  return `You are an expert AI image/video prompt engineer specializing in brand-consistent media generation.

Your task is to craft a precise generation prompt that:
1. Captures the user's creative intent
2. Enforces the brand's visual DNA constraints
3. Maximizes output quality for the ${input.mediaType} format

Brand DNA Summary:
- Colors: ${input.dna.colorPalette.primary.map((c) => c.hex).join(', ')}
- Style: ${input.dna.visualStyle}
- Mood: ${input.dna.mood.join(', ')}
- Forbidden elements: ${input.dna.forbiddenElements.join(', ')}

Output a JSON object with: positivePrompt, negativePrompt, styleModifiers, technicalParams.`;
}

function buildStubResult(input: PromptEngineerInput): GenerationPrompt {
  const mood = input.dna.mood.join(', ');
  const colors = input.dna.colorPalette.primary.map((c) => c.name).join(', ');
  const forbidden = input.dna.forbiddenElements.join(', ');

  const dimensions: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '4:5': { width: 896, height: 1120 },
  };

  const dim = dimensions[input.aspectRatio] ?? dimensions['1:1'];

  return {
    positivePrompt: `${input.analyzedBrief.intent}, ${mood} mood, ${colors} color palette, ${input.dna.visualStyle}, ${input.dna.lightingStyle}, high quality, photorealistic`,
    negativePrompt: `${forbidden}, low quality, blurry, distorted, watermark`,
    styleModifiers: [
      ...input.dna.mood,
      input.dna.lightingStyle,
      input.dna.colorTreatment,
    ],
    technicalParams: {
      model: 'fal-ai/flux/dev',
      steps: 28,
      guidanceScale: 7.5,
      width: dim.width,
      height: dim.height,
    },
  };
}

export async function runPromptEngineer(
  input: PromptEngineerInput,
): Promise<GenerationPrompt> {
  const stubMode = process.env.USE_STUBS !== 'false';

  if (stubMode) {
    logger.info('Prompt engineer running in stub mode');
    return buildStubResult(input);
  }

  const tools = getToolsForAgent(['score_brand_alignment']);
  const result = await runAgent(
    {
      name: 'prompt-engineer',
      systemPrompt: buildSystemPrompt(input),
      tools,
    },
    input,
  );

  try {
    return JSON.parse(result.text) as GenerationPrompt;
  } catch (err) {
    throw new AgentError(
      'prompt-engineer',
      'OUTPUT_PARSE_FAILED',
      'Failed to parse prompt engineer output as JSON',
      false,
      err,
    );
  }
}
