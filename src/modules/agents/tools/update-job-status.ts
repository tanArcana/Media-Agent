import { logger } from '@/lib/logger';
import type { ToolDefinition } from '../types';

export const updateJobStatusTool: ToolDefinition = {
  tool: {
    name: 'update_job_status',
    description: 'Updates the pipeline job status and emits a progress event.',
    input_schema: {
      type: 'object' as const,
      properties: {
        jobId: { type: 'string', description: 'The pipeline job ID' },
        status: {
          type: 'string',
          description: 'New job status',
          enum: ['QUEUED', 'RUNNING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED'],
        },
        progress: { type: 'number', description: 'Progress percentage 0-100' },
        message: { type: 'string', description: 'Human-readable status message' },
      },
      required: ['jobId', 'status'],
    },
  },
  handler: async (input) => {
    // Stub: log the status update, return success
    logger.info(
      {
        jobId: input.jobId,
        status: input.status,
        progress: input.progress,
        message: input.message,
      },
      'Job status updated',
    );
    return { success: true };
  },
};
