import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_DNA } from '@/modules/brand-dna';
import type { AnalyzedBrief } from '@/modules/pipeline/types';
import { runPromptEngineer } from './prompt-engineer';
import type { PromptEngineerInput } from './prompt-engineer';

describe('runPromptEngineer', () => {
  let input: PromptEngineerInput;

  beforeEach(() => {
    process.env.USE_STUBS = 'true';

    const analyzedBrief: AnalyzedBrief = {
      intent: 'A woman holding a coffee cup in a modern kitchen',
      keyElements: ['woman', 'coffee cup', 'kitchen'],
      mood: 'warm and inviting',
      suggestedCompositions: ['rule of thirds', 'medium shot'],
    };

    input = {
      analyzedBrief,
      dna: { ...DEFAULT_DNA, extractedAt: new Date() },
      mediaType: 'IMAGE',
      aspectRatio: '1:1',
    };
  });

  it('returns a valid GenerationPrompt object', async () => {
    const result = await runPromptEngineer(input);

    expect(result).toHaveProperty('positivePrompt');
    expect(result).toHaveProperty('negativePrompt');
    expect(result).toHaveProperty('styleModifiers');
    expect(result).toHaveProperty('technicalParams');
    expect(typeof result.positivePrompt).toBe('string');
    expect(typeof result.negativePrompt).toBe('string');
    expect(Array.isArray(result.styleModifiers)).toBe(true);
  });

  it('includes brand mood in positive prompt', async () => {
    const result = await runPromptEngineer(input);
    // DEFAULT_DNA mood is ['neutral', 'professional']
    expect(result.positivePrompt).toContain('neutral');
  });

  it('includes forbidden elements in negative prompt', async () => {
    const result = await runPromptEngineer(input);
    // DEFAULT_DNA forbiddenElements includes 'explicit content'
    expect(result.negativePrompt).toContain('explicit content');
  });

  it('sets correct dimensions for 16:9 aspect ratio', async () => {
    input.aspectRatio = '16:9';
    const result = await runPromptEngineer(input);

    expect(result.technicalParams.width).toBe(1344);
    expect(result.technicalParams.height).toBe(768);
  });

  it('sets correct dimensions for 9:16 aspect ratio', async () => {
    input.aspectRatio = '9:16';
    const result = await runPromptEngineer(input);

    expect(result.technicalParams.width).toBe(768);
    expect(result.technicalParams.height).toBe(1344);
  });

  it('includes the analyzed brief intent in the prompt', async () => {
    const result = await runPromptEngineer(input);
    expect(result.positivePrompt).toContain('A woman holding a coffee cup');
  });

  it('includes model in technical params', async () => {
    const result = await runPromptEngineer(input);
    expect(result.technicalParams.model).toBe('fal-ai/flux/dev');
  });
});
