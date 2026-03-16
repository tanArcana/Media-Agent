import { prisma } from '@/lib/prisma';
import { DEFAULT_DNA, type BrandDNA } from '@/modules/brand-dna';
import type { ToolDefinition } from '../types';

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

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
    const workspaceId = input.workspaceId as string;

    if (isStubMode()) {
      return { ...DEFAULT_DNA, extractedAt: new Date() };
    }

    const dbDna = await prisma.brandDNA.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { version: 'desc' },
    });

    if (!dbDna) {
      return { ...DEFAULT_DNA, extractedAt: new Date() };
    }

    return {
      brandName: dbDna.brandName,
      industry: dbDna.industry,
      brandPersonality: dbDna.brandPersonality,
      colorPalette: dbDna.colorPalette,
      typography: dbDna.typography,
      visualStyle: dbDna.visualStyle,
      mood: dbDna.mood,
      lightingStyle: dbDna.lightingStyle,
      colorTreatment: dbDna.colorTreatment,
      composition: dbDna.composition,
      forbiddenElements: dbDna.forbiddenElements,
      requiredElements: dbDna.requiredElements,
      subjectTypes: dbDna.subjectTypes,
      version: dbDna.version,
      extractedAt: dbDna.createdAt,
      extractionConfidence: dbDna.extractionConfidence,
    } as BrandDNA;
  },
};
