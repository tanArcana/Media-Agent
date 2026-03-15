import type Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_DNA, type BrandDNA } from '@/modules/brand-dna';
import type { ToolDefinition } from '../types';

export const loadBrandDnaTool: ToolDefinition = {
  tool: {
    name: 'load_brand_dna',
    description: 'Loads the Brand DNA for a workspace from the database.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'The workspace ID' },
      },
      required: ['workspaceId'],
    },
  },
  handler: async (input): Promise<BrandDNA> => {
    // Stub: return DEFAULT_DNA. In production, query Prisma.
    const _workspaceId = input.workspaceId as string;
    return { ...DEFAULT_DNA, extractedAt: new Date() };
  },
};
