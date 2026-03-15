import { describe, it, expect, beforeEach } from 'vitest';
import { BrandDNASchema } from '@/modules/brand-dna';
import { runDNAExtractor } from './dna-extractor';
import type { DNAExtractorInput } from './dna-extractor';

describe('runDNAExtractor', () => {
  let input: DNAExtractorInput;

  beforeEach(() => {
    process.env.USE_STUBS = 'true';

    input = {
      workspaceId: 'ws_test123',
      brandName: 'Acme Coffee',
      materialUrls: [
        'https://example.com/logo.png',
        'https://example.com/brand-guide.pdf',
      ],
    };
  });

  it('returns a valid BrandDNA object', async () => {
    const result = await runDNAExtractor(input);
    const parsed = BrandDNASchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('uses the provided brand name', async () => {
    const result = await runDNAExtractor(input);
    expect(result.brandName).toBe('Acme Coffee');
  });

  it('has a non-zero extraction confidence', async () => {
    const result = await runDNAExtractor(input);
    expect(result.extractionConfidence).toBeGreaterThan(0);
  });

  it('sets extractedAt to a recent date', async () => {
    const before = new Date();
    const result = await runDNAExtractor(input);
    expect(result.extractedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
