import type { ToolDefinition } from '../types';

export const scoreBrandAlignmentTool: ToolDefinition = {
  tool: {
    name: 'score_brand_alignment',
    description: 'Scores how well a prompt aligns with a Brand DNA and suggests adjustments.',
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: { type: 'string', description: 'The generation prompt to evaluate' },
        dna: { type: 'object', description: 'The BrandDNA object' },
      },
      required: ['prompt', 'dna'],
    },
  },
  handler: async (_input) => {
    // Stub: always return a good alignment score
    return {
      score: 0.85,
      conflicts: [],
      adjustments: ['Adjusted color references to match brand palette'],
    };
  },
};
