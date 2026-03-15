export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export type PipelineStage =
  | 'BRIEF_ANALYSIS'
  | 'DNA_ALIGNMENT'
  | 'PROMPT_ENGINEERING'
  | 'GENERATION'
  | 'QUALITY_GATE'
  | 'DELIVERY';

export type PipelineErrorCode =
  | 'BRIEF_PARSE_FAILED'
  | 'DNA_NOT_FOUND'
  | 'PROMPT_GENERATION_FAILED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'QUALITY_GATE_REJECTED'
  | 'STORAGE_FAILED';

export class PipelineError extends Error {
  constructor(
    public readonly stage: PipelineStage,
    public readonly code: PipelineErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

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
