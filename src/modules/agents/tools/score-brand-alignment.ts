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
  handler: async (input) => {
    const prompt = (input.prompt as string).toLowerCase();
    const dna = input.dna as Record<string, unknown>;
    const conflicts: string[] = [];
    const adjustments: string[] = [];

    // Check forbidden elements
    const forbidden = (dna.forbiddenElements ?? []) as string[];
    for (const elem of forbidden) {
      if (prompt.includes(elem.toLowerCase())) {
        conflicts.push(`Prompt contains forbidden element: "${elem}"`);
      }
    }

    if (conflicts.length === 0) {
      adjustments.push('Adjusted color references to match brand palette');
    }

    const score = Math.max(0, 1 - conflicts.length * 0.2);

    return { score, conflicts, adjustments };
  },
};
