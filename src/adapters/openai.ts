import { LLMAdapter, ChatParams, ChatResponse } from './base.js';
import { registerAdapter } from './registry.js';
import { logger } from '../logger.js';
import OpenAI from 'openai';

/**
 * OpenAI Adapter
 * 支持 GPT-4 Turbo、GPT-4、GPT-3.5 Turbo
 * 降级链：pro → flash → lite
 */
export class OpenAIAdapter extends LLMAdapter {
  private client: OpenAI;
  private models: Record<string, string>;

  constructor(config: {apiKey?: string; baseURL?: string} = {}) {
    super();
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('[OpenAI] API Key not configured');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1'
    });

    this.models = {
      pro: 'gpt-4-turbo-preview',
      flash: 'gpt-4',
      lite: 'gpt-3.5-turbo'
    };
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const level = params.preferredLevel || 'pro';
    const model = this.models[level];

    try {
      const messages = this._convertHistory(
        params.systemInstruction,
        params.history,
        params.message
      );

      const openaiTools = this._convertTools(params.tools || []);

      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096
      };

      if (openaiTools.length > 0) {
        requestParams.tools = openaiTools;
        requestParams.tool_choice = 'auto';
      }

      logger.debug(`[OpenAI] Calling ${model}`);
      const response = await this.client.chat.completions.create(requestParams);

      const choice = response.choices[0];
      const message = choice.message;

      // 检查函数调用
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.type === 'function') {
          return {
            text: message.content || '',
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments)
            }
          };
        }
      }

      return {
        text: message.content || ''
      };
    } catch (error) {
      logger.error(`[OpenAI] Error with ${model}: ${error}`);

      // 降级处理
      if (level === 'pro') {
        logger.warn('[OpenAI] Downgrading to flash');
        return this.chat({...params, preferredLevel: 'flash'});
      } else if (level === 'flash') {
        logger.warn('[OpenAI] Downgrading to lite');
        return this.chat({...params, preferredLevel: 'lite'});
      }

      throw error;
    }
  }

  private _convertHistory(
    systemInstruction: string,
    history: Array<{role: string; parts: Array<{text: string}>}>,
    message: string | Array<{text: string}>
  ): Array<OpenAI.Chat.ChatCompletionMessageParam> {
    const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

    // 系统提示词
    if (systemInstruction) {
      messages.push({
        role: 'system',
        content: systemInstruction
      });
    }

    // 历史记录
    for (const item of history) {
      if (item.role === 'user') {
        messages.push({
          role: 'user',
          content: this._extractText(item.parts)
        });
      } else if (item.role === 'model') {
        messages.push({
          role: 'assistant',
          content: this._extractText(item.parts)
        });
      }
    }

    // 当前消息
    if (typeof message === 'string') {
      messages.push({
        role: 'user',
        content: message
      });
    } else if (Array.isArray(message)) {
      messages.push({
        role: 'user',
        content: this._extractText(message)
      });
    }

    return messages;
  }

  private _extractText(parts: Array<{text: string}>): string {
    return parts.map(p => p.text).join('\n');
  }

  private _convertTools(
    tools: Array<{name: string; description: string; parameters: Record<string, unknown>}>
  ): Array<OpenAI.Chat.ChatCompletionTool> {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }
}

// 自动注册至 Adapter Registry
registerAdapter('openai', () => new OpenAIAdapter());
