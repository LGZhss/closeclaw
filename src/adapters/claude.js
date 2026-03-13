/**
 * Claude Adapter (P9: 多模型支持)
 * 
 * 支持模型：
 * - Claude 3.5 Sonnet
 * - Claude 3 Opus
 * - Claude 3 Sonnet
 * - Claude 3 Haiku
 * 
 * 功能：
 * - Tool Use (Claude 的 Function Calling)
 * - 降级链：claude-3-5-sonnet → claude-3-opus → claude-3-sonnet → claude-3-haiku
 */

import { LLMAdapter } from './base.js';
import { log } from '../utils/logger.js';
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
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

  /**
   * 对话接口
   * @param {Object} options
   * @param {string} options.systemInstruction 系统提示词
   * @param {Array} options.history 对话历史
   * @param {string|Array} options.message 用户消息
   * @param {Array} options.tools 工具定义
   * @param {string} options.preferredLevel 优先级别 (pro/flash/lite/mini)
   * @returns {Promise<{text: string, functionCall?: Object}>}
   */
  async chat({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }) {
    const model = this.models[preferredLevel] || this.models.pro;
    
    try {
      // 转换历史记录格式
      const messages = this._convertHistory(history, message);
      
      // 转换工具定义
      const claudeTools = this._convertTools(tools);
      
      const params = {
        model,
        max_tokens: 4096,
        system: systemInstruction,
        messages
      };
      
      if (claudeTools.length > 0) {
        params.tools = claudeTools;
      }
      
      log(`[Claude] Calling ${model}`, 'DEBUG');
      const response = await this.client.messages.create(params);
      
      // 提取文本内容
      let text = '';
      let functionCall = null;
      
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
    } catch (error) {
      log(`[Claude] Error: ${error.message}`, 'ERROR');
      
      // 降级处理
      if (preferredLevel === 'pro') {
        log('[Claude] Downgrading to flash', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'flash' });
      } else if (preferredLevel === 'flash') {
        log('[Claude] Downgrading to lite', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'lite' });
      } else if (preferredLevel === 'lite') {
        log('[Claude] Downgrading to mini', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'mini' });
      }
      
      throw error;
    }
  }

  /**
   * 转换历史记录格式
   */
  _convertHistory(history, message) {
    const messages = [];
    
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
   * 转换工具定义为 Claude 格式
   */
  _convertTools(tools) {
    if (!tools || tools.length === 0) return [];
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));
  }

  /**
   * 生成内容（流式）
   */
  async *generateStream({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }) {
    const model = this.models[preferredLevel] || this.models.pro;
    
    const messages = this._convertHistory(history, message);
    const claudeTools = this._convertTools(tools);
    
    const params = {
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
