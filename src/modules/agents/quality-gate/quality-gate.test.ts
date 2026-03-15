import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_DNA } from '@/modules/brand-dna';
import { runQualityGate } from './quality-gate';
import type { QualityGateInput } from './quality-gate';

describe('runQualityGate', () => {
  let input: QualityGateInput;

  beforeEach(() => {
    process.env.USE_STUBS = 'true';

    input = {
      imageUrl: 'https://mock.storage/outputs/result.png',
      dna: { ...DEFAULT_DNA, extractedAt: new Date() },
      mediaType: 'IMAGE',
      originalPrompt: 'A professional photo of a coffee cup',
    };
  });

  it('returns a valid QualityResult', async () => {
    const result = await runQualityGate(input);

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('brandComplianceScore');
    expect(result).toHaveProperty('safetyScore');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('requiresHumanReview');
  });

  it('stub returns passing result', async () => {
    const result = await runQualityGate(input);
    expect(result.passed).toBe(true);
  });

  it('stub returns high scores', async () => {
    const result = await runQualityGate(input);
    expect(result.overallScore).toBeGreaterThan(0.8);
    expect(result.safetyScore).toBeGreaterThan(0.9);
  });

  it('stub returns no issues', async () => {
    const result = await runQualityGate(input);
    expect(result.issues).toHaveLength(0);
  });

  it('stub does not require human review', async () => {
    const result = await runQualityGate(input);
    expect(result.requiresHumanReview).toBe(false);
  });
});
