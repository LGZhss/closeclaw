/**
 * OpenAI Adapter (P9: 多模型支持)
 * 
 * 支持模型：
 * - GPT-4 Turbo
 * - GPT-4
 * - GPT-3.5 Turbo
 * 
 * 功能：
 * - Function Calling
 * - 降级链：gpt-4-turbo → gpt-4 → gpt-3.5-turbo
 */

import { LLMAdapter } from './base.js';
import { log } from '../utils/logger.js';
import OpenAI from 'openai';

export class OpenAIAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.models = {
      pro: 'gpt-4-turbo-preview',
      flash: 'gpt-4',
      lite: 'gpt-3.5-turbo'
    };
    
    if (!this.apiKey) {
      throw new Error('[OpenAI] API Key not configured');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL
    });
  }

  /**
   * 对话接口
   * @param {Object} options
   * @param {string} options.systemInstruction 系统提示词
   * @param {Array} options.history 对话历史
   * @param {string|Array} options.message 用户消息
   * @param {Array} options.tools 工具定义
   * @param {string} options.preferredLevel 优先级别 (pro/flash/lite)
   * @returns {Promise<{text: string, functionCall?: Object}>}
   */
  async chat({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }) {
    const model = this.models[preferredLevel] || this.models.pro;
    
    try {
      // 转换历史记录格式
      const messages = this._convertHistory(systemInstruction, history, message);
      
      // 转换工具定义
      const openaiTools = this._convertTools(tools);
      
      const params = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096
      };
      
      if (openaiTools.length > 0) {
        params.tools = openaiTools;
        params.tool_choice = 'auto';
      }
      
      log(`[OpenAI] Calling ${model}`, 'DEBUG');
      const response = await this.client.chat.completions.create(params);
      
      const choice = response.choices[0];
      const message = choice.message;
      
      // 检查是否有函数调用
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        return {
          text: message.content || '',
          functionCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments)
          }
        };
      }
      
      return {
        text: message.content || ''
      };
    } catch (error) {
      log(`[OpenAI] Error: ${error.message}`, 'ERROR');
      
      // 降级处理
      if (preferredLevel === 'pro') {
        log('[OpenAI] Downgrading to flash', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'flash' });
      } else if (preferredLevel === 'flash') {
        log('[OpenAI] Downgrading to lite', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'lite' });
      }
      
      throw error;
    }
  }

  /**
   * 转换历史记录格式
   */
  _convertHistory(systemInstruction, history, message) {
    const messages = [];
    
    // 添加系统提示词
    if (systemInstruction) {
      messages.push({
        role: 'system',
        content: systemInstruction
      });
    }
    
    // 转换历史记录
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
    
    // 添加当前消息
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

  /**
   * 提取文本内容
   */
  _extractText(parts) {
    if (!Array.isArray(parts)) return '';
    return parts
      .filter(p => p.text)
      .map(p => p.text)
      .join('\n');
  }

  /**
   * 转换工具定义为 OpenAI 格式
   */
  _convertTools(tools) {
    if (!tools || tools.length === 0) return [];
    
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * 生成内容（流式）
   */
  async *generateStream({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }) {
    const model = this.models[preferredLevel] || this.models.pro;
    
    const messages = this._convertHistory(systemInstruction, history, message);
    const openaiTools = this._convertTools(tools);
    
    const params = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true
    };
    
    if (openaiTools.length > 0) {
      params.tools = openaiTools;
      params.tool_choice = 'auto';
    }
    
    const stream = await this.client.chat.completions.create(params);
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield delta.content;
      }
    }
  }
}
