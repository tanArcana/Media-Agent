import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { AgentError, MAX_AGENT_ITERATIONS } from './types';
import type { ToolDefinition } from './types';

export interface AgentConfig {
  name: string;
  model?: string;
  maxTokens?: number;
  systemPrompt: string;
  tools: ToolDefinition[];
}

export interface AgentResult {
  text: string;
  toolCallCount: number;
  iterations: number;
}

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export async function runAgent(
  config: AgentConfig,
  input: unknown,
): Promise<AgentResult> {
  const { name, systemPrompt, tools } = config;
  const model = config.model ?? 'claude-opus-4-6';
  const maxTokens = config.maxTokens ?? 4096;

  if (isStubMode()) {
    logger.info({ agent: name }, 'Agent running in stub mode (USE_STUBS=true)');
    return {
      text: JSON.stringify(input),
      toolCallCount: 0,
      iterations: 0,
    };
  }

  const client = new Anthropic();

  const anthropicTools: Anthropic.Tool[] = tools.map((t) => t.tool);
  const toolHandlers = new Map(tools.map((t) => [t.tool.name, t.handler]));

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: JSON.stringify(input) },
  ];

  let iterations = 0;
  let toolCallCount = 0;

  while (iterations < MAX_AGENT_ITERATIONS) {
    iterations++;

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: anthropicTools,
        messages,
      });
    } catch (err) {
      throw new AgentError(
        name,
        'CLAUDE_API_ERROR',
        err instanceof Error ? err.message : 'Claude API call failed',
        true,
        err,
      );
    }

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      return {
        text: textBlock?.type === 'text' ? textBlock.text : '',
        toolCallCount,
        iterations,
      };
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const handler = toolHandlers.get(block.name);
        if (!handler) {
          throw new AgentError(
            name,
            'TOOL_CALL_FAILED',
            `Unknown tool: ${block.name}`,
          );
        }

        toolCallCount++;
        try {
          const result = await handler(block.input as Record<string, unknown>);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          throw new AgentError(
            name,
            'TOOL_CALL_FAILED',
            `Tool ${block.name} failed: ${err instanceof Error ? err.message : 'unknown'}`,
            false,
            err,
          );
        }
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason
    break;
  }

  throw new AgentError(
    name,
    'MAX_ITERATIONS_EXCEEDED',
    `Agent ${name} exceeded ${MAX_AGENT_ITERATIONS} iterations`,
    false,
  );
}
