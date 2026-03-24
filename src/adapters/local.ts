import { LLMAdapter, ChatParams, ChatResponse } from './base.js';
import { logger } from '../logger.js';

export class LocalAdapter extends LLMAdapter {
  private baseURL: string;
  private platform: string;
  private models: Record<string, string>;

  constructor(config: any = {}) {
    super();
    this.baseURL = config.baseURL || 'http://localhost:11434';
    this.platform = config.platform || 'ollama';
    this.models = {
      pro: config.proModel || 'llama3.1:70b',
      flash: config.flashModel || 'llama3.1:8b',
      lite: config.liteModel || 'llama3.2:3b'
    };
  }

  async chat({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }: ChatParams): Promise<ChatResponse> {
    const model = this.models[preferredLevel] || this.models.pro;
    
    try {
      const prompt = this._buildPrompt(systemInstruction, history, message, tools);
      
      logger.debug(`[Local] Calling ${model} on ${this.platform}`);
      
      let responseText: string;
      if (this.platform === 'ollama') {
        responseText = await this._callOllama(model, prompt);
      } else if (this.platform === 'lmstudio' || this.platform === 'localai') {
        responseText = await this._callOpenAICompatible(model, prompt);
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }
      
      const functionCall = this._parseFunctionCall(responseText, tools);
      
      return {
        text: responseText,
        functionCall
      };
    } catch (error: any) {
      logger.error(`[Local] Error: ${error.message}`);
      
      if (preferredLevel === 'pro') {
        logger.warn('[Local] Downgrading to flash');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'flash' });
      } else if (preferredLevel === 'flash') {
        logger.warn('[Local] Downgrading to lite');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'lite' });
      }
      
      throw error;
    }
  }

  private async _callOllama(model: string, prompt: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const data = (await response.json()) as any;
    return data.response;
  }

  private async _callOpenAICompatible(model: string, prompt: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI Compatible API error: ${response.statusText}`);
    }
    
    const data = (await response.json()) as any;
    return data.choices[0].message.content;
  }

  private _buildPrompt(systemInstruction: string | undefined, history: any[], message: any, tools: any[]): string {
    let prompt = '';
    
    if (systemInstruction) {
      prompt += `System: ${systemInstruction}\n\n`;
    }
    
    if (tools && tools.length > 0) {
      prompt += 'Available Tools:\n';
      for (const tool of tools) {
        prompt += `- ${tool.name}: ${tool.description}\n`;
        prompt += `  Parameters: ${JSON.stringify(tool.parameters)}\n`;
      }
      prompt += '\nTo use a tool, respond with: TOOL_CALL: {name: "tool_name", args: {...}}\n\n';
    }
    
    for (const item of history) {
      const role = item.role === 'user' ? 'User' : 'Assistant';
      const text = this._extractText(item.parts);
      prompt += `${role}: ${text}\n\n`;
    }
    
    if (typeof message === 'string') {
      prompt += `User: ${message}\n\nAssistant:`;
    } else if (Array.isArray(message)) {
      prompt += `User: ${this._extractText(message)}\n\nAssistant:`;
    }
    
    return prompt;
  }

  private _extractText(parts: any[]): string {
    if (!Array.isArray(parts)) return '';
    return parts
      .filter(p => p.text)
      .map(p => p.text)
      .join('\n');
  }

  private _parseFunctionCall(text: string, tools: any[]): any {
    if (!tools || tools.length === 0) return null;
    
    const match = text.match(/TOOL_CALL:\s*({[\s\S]*?})/);
    if (!match) return null;
    
    try {
      const callData = JSON.parse(match[1]);
      return {
        name: callData.name,
        args: callData.args
      };
    } catch (e: any) {
      logger.warn(`[Local] Failed to parse function call: ${e.message}`);
      return null;
    }
  }

  async *generateStream({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }: ChatParams): AsyncGenerator<string, void, unknown> {
    const model = this.models[preferredLevel] || this.models.pro;
    const prompt = this._buildPrompt(systemInstruction, history, message, tools);
    
    if (this.platform === 'ollama') {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: true })
      });
      
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch (e) {}
        }
      }
    } else {
      const result = await this.chat({ systemInstruction, history, message, tools, preferredLevel });
      yield result.text;
    }
  }
}
