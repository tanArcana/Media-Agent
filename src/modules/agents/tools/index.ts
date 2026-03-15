import type { ToolDefinition } from '../types';
import { loadBrandDnaTool } from './load-brand-dna';
import { scoreBrandAlignmentTool } from './score-brand-alignment';
import { generateMediaTool } from './generate-media';
import { analyzeImageTool } from './analyze-image';
import { storeAssetTool } from './store-asset';
import { updateJobStatusTool } from './update-job-status';

export const allTools: Record<string, ToolDefinition> = {
  load_brand_dna: loadBrandDnaTool,
  score_brand_alignment: scoreBrandAlignmentTool,
  generate_media: generateMediaTool,
  analyze_image: analyzeImageTool,
  store_asset: storeAssetTool,
  update_job_status: updateJobStatusTool,
};

export function getToolsForAgent(toolNames: string[]): ToolDefinition[] {
  return toolNames.map((name) => {
    const tool = allTools[name];
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool;
  });
}

export {
  loadBrandDnaTool,
  scoreBrandAlignmentTool,
  generateMediaTool,
  analyzeImageTool,
  storeAssetTool,
  updateJobStatusTool,
};
