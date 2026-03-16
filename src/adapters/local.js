/**
 * Local Model Adapter (P9: 多模型支持)
 * 
 * 支持平台：
 * - Ollama
 * - LM Studio
 * - LocalAI
 * 
 * 功能：
 * - 统一接口封装
 * - 自动检测平台
 * - Function Calling 模拟
 */

import { LLMAdapter } from './base.js';
import { log } from '../utils/logger.js';

export class LocalAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.baseURL = config.baseURL || 'http://localhost:11434'; // Ollama 默认端口
    this.platform = config.platform || 'ollama'; // ollama | lmstudio | localai
    this.models = {
      pro: config.proModel || 'llama3.1:70b',
      flash: config.flashModel || 'llama3.1:8b',
      lite: config.liteModel || 'llama3.2:3b'
    };
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
      // 构建提示词
      const prompt = this._buildPrompt(systemInstruction, history, message, tools);
      
      log(`[Local] Calling ${model} on ${this.platform}`, 'DEBUG');
      
      // 根据平台调用不同的 API
      let response;
      if (this.platform === 'ollama') {
        response = await this._callOllama(model, prompt);
      } else if (this.platform === 'lmstudio') {
        response = await this._callLMStudio(model, prompt);
      } else if (this.platform === 'localai') {
        response = await this._callLocalAI(model, prompt);
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }
      
      // 解析函数调用（如果有）
      const functionCall = this._parseFunctionCall(response.text, tools);
      
      return {
        text: response.text,
        functionCall
      };
    } catch (error) {
      log(`[Local] Error: ${error.message}`, 'ERROR');
      
      // 降级处理
      if (preferredLevel === 'pro') {
        log('[Local] Downgrading to flash', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'flash' });
      } else if (preferredLevel === 'flash') {
        log('[Local] Downgrading to lite', 'WARN');
        return this.chat({ systemInstruction, history, message, tools, preferredLevel: 'lite' });
      }
      
      throw error;
    }
  }

  /**
   * 调用 Ollama API
   */
  async _callOllama(model, prompt) {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { text: data.response };
  }

  /**
   * 调用 LM Studio API (OpenAI 兼容)
   */
  async _callLMStudio(model, prompt) {
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
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { text: data.choices[0].message.content };
  }

  /**
   * 调用 LocalAI API (OpenAI 兼容)
   */
  async _callLocalAI(model, prompt) {
    return this._callLMStudio(model, prompt); // 使用相同的 OpenAI 兼容接口
  }

  /**
   * 构建提示词
   */
  _buildPrompt(systemInstruction, history, message, tools) {
    let prompt = '';
    
    // 添加系统提示词
    if (systemInstruction) {
      prompt += `System: ${systemInstruction}\n\n`;
    }
    
    // 添加工具定义（如果有）
    if (tools && tools.length > 0) {
      prompt += 'Available Tools:\n';
      for (const tool of tools) {
        prompt += `- ${tool.name}: ${tool.description}\n`;
        prompt += `  Parameters: ${JSON.stringify(tool.parameters)}\n`;
      }
      prompt += '\nTo use a tool, respond with: TOOL_CALL: {name: "tool_name", args: {...}}\n\n';
    }
    
    // 添加历史记录
    for (const item of history) {
      const role = item.role === 'user' ? 'User' : 'Assistant';
      const text = this._extractText(item.parts);
      prompt += `${role}: ${text}\n\n`;
    }
    
    // 添加当前消息
    if (typeof message === 'string') {
      prompt += `User: ${message}\n\nAssistant:`;
    } else if (Array.isArray(message)) {
      prompt += `User: ${this._extractText(message)}\n\nAssistant:`;
    }
    
    return prompt;
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
   * 解析函数调用（从文本中提取）
   */
  _parseFunctionCall(text, tools) {
    if (!tools || tools.length === 0) return null;
    
    // 查找 TOOL_CALL: {...} 格式
    const match = text.match(/TOOL_CALL:\s*({[\s\S]*?})/);
    if (!match) return null;
    
    try {
      const callData = JSON.parse(match[1]);
      return {
        name: callData.name,
        args: callData.args
      };
    } catch (e) {
      log(`[Local] Failed to parse function call: ${e.message}`, 'WARN');
      return null;
    }
  }

  /**
   * 生成内容（流式）
   */
  async *generateStream({ systemInstruction, history, message, tools = [], preferredLevel = 'pro' }) {
    const model = this.models[preferredLevel] || this.models.pro;
    const prompt = this._buildPrompt(systemInstruction, history, message, tools);
    
    if (this.platform === 'ollama') {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: true
        })
      });
      
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
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } else {
      // LM Studio 和 LocalAI 使用非流式
      const result = await this.chat({ systemInstruction, history, message, tools, preferredLevel });
      yield result.text;
    }
  }
}
