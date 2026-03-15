import type Anthropic from '@anthropic-ai/sdk';

export type AgentErrorCode =
  | 'MAX_ITERATIONS_EXCEEDED'
  | 'INVALID_OUTPUT'
  | 'TOOL_CALL_FAILED'
  | 'CLAUDE_API_ERROR'
  | 'OUTPUT_PARSE_FAILED';

export class AgentError extends Error {
  constructor(
    public readonly agentName: string,
    public readonly code: AgentErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export const MAX_AGENT_ITERATIONS = 20;

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export interface ToolDefinition {
  tool: Anthropic.Tool;
  handler: ToolHandler;
}
