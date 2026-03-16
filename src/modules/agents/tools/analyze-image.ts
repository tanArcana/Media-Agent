import Anthropic from '@anthropic-ai/sdk';
import type { ToolDefinition } from '../types';

function useStubs(): boolean {
  return process.env.USE_STUBS !== 'false';
}

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
    if (useStubs()) {
      return {
        analysis: `Mock analysis of image at ${input.imageUrl}: Professional quality, balanced composition, warm color palette, good lighting.`,
        structuredData: {
          dominantColors: ['#2B2D42', '#8D99AE', '#EDF2F4'],
          mood: 'professional',
          quality: 'high',
        },
      };
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: input.imageUrl as string } },
            { type: 'text', text: input.analysisPrompt as string },
          ],
        },
      ],
    });

    const text = response.content.find((b) => b.type === 'text');
    const analysisText = text?.type === 'text' ? text.text : '';

    let structuredData: Record<string, unknown> | undefined;
    try {
      structuredData = JSON.parse(analysisText);
    } catch {
      // Not JSON — return as plain text analysis
    }

    return { analysis: analysisText, structuredData };
  },
};
