import { LLMAdapter, ChatParams, ChatResponse } from './base.js';
import { logger } from '../logger.js';
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAdapter extends LLMAdapter {
  private readonly apiKey: string;
  private readonly client: Anthropic;
  private readonly models: Record<string, string>;

  constructor(config: { apiKey?: string } = {}) {
    super();
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.models = {
      pro: 'claude-3-5-sonnet-20241022',
      flash: 'claude-3-opus-20240229',
      lite: 'claude-3-sonnet-20240229',
      mini: 'claude-3-haiku-20240307'
    };
    
    if (!this.apiKey) {
      throw new Error('[Claude] API Key not configured');
    }

    this.client = new Anthropic({
      apiKey: this.apiKey
    });
  }

  async chat({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }: ChatParams): Promise<ChatResponse> {
    const model = this.models[preferredLevel] || this.models.pro;
    
    try {
      const messages = this._convertHistory(history, message);
      const claudeTools = this._convertTools(tools);
      
      const params: any = {
        model,
        max_tokens: 4096,
        system: systemInstruction,
        messages
      };
      
      if (claudeTools.length > 0) {
        params.tools = claudeTools;
      }
      
      logger.debug(`[Claude] Calling ${model}`);
      const response = await this.client.messages.create(params);
      
      let text = '';
      let functionCall: any = null;
      
      for (const content of response.content) {
        if (content.type === 'text') {
          text += content.text;
        } else if (content.type === 'tool_use') {
          functionCall = {
            name: content.name,
            args: content.input
          };
        }
      }
      
      return {
        text,
        functionCall
      };
    } catch (error: any) {
      logger.error(`[Claude] Error: ${error.message}`);
      
      // Fallback
      if (preferredLevel === 'pro') {
        logger.warn('[Claude] Downgrading to flash');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'flash' });
      } else if (preferredLevel === 'flash') {
        logger.warn('[Claude] Downgrading to lite');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'lite' });
      } else if (preferredLevel === 'lite') {
        logger.warn('[Claude] Downgrading to mini');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'mini' });
      }
      
      throw error;
    }
  }

  private _convertHistory(history: any[], message: any): any[] {
    const messages: any[] = [];
    
    for (const item of history) {
      if (item.role === 'user') {
        messages.push({
          role: 'user',
          content: this._extractText(item.parts)
        });
      } else if (item.role === 'model' || item.role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: this._extractText(item.parts)
        });
      }
    }
    
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

  private _extractText(parts: any[]): string {
    if (!Array.isArray(parts)) return '';
    return parts
      .filter(p => p.text)
      .map(p => p.text)
      .join('\n');
  }

  private _convertTools(tools: any[]): any[] {
    if (!tools || tools.length === 0) return [];
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));
  }

  async *generateStream({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }: ChatParams): AsyncGenerator<string, void, unknown> {
    const model = this.models[preferredLevel] || this.models.pro;
    
    const messages = this._convertHistory(history, message);
    const claudeTools = this._convertTools(tools);
    
    const params: any = {
      model,
      max_tokens: 4096,
      system: systemInstruction,
      messages,
      stream: true
    };
    
    if (claudeTools.length > 0) {
      params.tools = claudeTools;
    }
    
    const stream = await this.client.messages.stream(params);
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
