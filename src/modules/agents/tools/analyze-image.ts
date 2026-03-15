import type { ToolDefinition } from '../types';

export const analyzeImageTool: ToolDefinition = {
  tool: {
    name: 'analyze_image',
    description: 'Runs Claude vision on an image URL and returns structured analysis.',
    input_schema: {
      type: 'object' as const,
      properties: {
        imageUrl: { type: 'string', description: 'URL of the image to analyze' },
        analysisPrompt: { type: 'string', description: 'What to analyze in the image' },
      },
      required: ['imageUrl', 'analysisPrompt'],
    },
  },
  handler: async (input) => {
    // Stub: return mock analysis
    return {
      analysis: `Mock analysis of image at ${input.imageUrl}: Professional quality, balanced composition, warm color palette, good lighting.`,
      structuredData: {
        dominantColors: ['#2B2D42', '#8D99AE', '#EDF2F4'],
        mood: 'professional',
        quality: 'high',
      },
    };
  },
};
