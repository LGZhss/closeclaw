import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMAdapter, ChatParams, ChatResponse } from './base.js';
import { logger } from '../logger.js';

const MODELS: Record<string, string> = {
  pro: 'gemini-1.5-pro',
  flash: 'gemini-1.5-flash',
  lite: 'gemini-1.0-pro'
};

export class GeminiAdapter extends LLMAdapter {
  private genAI: GoogleGenerativeAI;

  constructor(config: { apiKey?: string } = {}) {
    super();
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat({ systemInstruction, history, message, tools, preferredLevel = 'lite' }: ChatParams): Promise<ChatResponse> {
    let fallbackChain: string[] = [];
    if (preferredLevel === 'pro') {
      fallbackChain = ['pro', 'flash', 'lite'];
    } else if (preferredLevel === 'flash') {
      fallbackChain = ['flash', 'lite', 'pro'];
    } else {
      fallbackChain = ['lite', 'flash', 'pro'];
    }

    let lastError: any = null;

    for (const level of fallbackChain) {
      if (!MODELS[level]) continue;
      const modelName = MODELS[level];

      try {
        const modelOpts: any = { model: modelName, systemInstruction };
        if (tools && tools.length > 0) {
          modelOpts.tools = [{ functionDeclarations: tools }];
        }
        const ai = this.genAI.getGenerativeModel(modelOpts);
        const chat = ai.startChat({ history });

        const messageText = typeof message === 'string' ? message : JSON.stringify(message);
        logger.debug(`[Gemini] CHAT [${level}/${modelName}]: ${messageText.slice(0, 60)}`);

        const result = await chat.sendMessage(messageText);
        const response = result.response;

        let reply = '';
        try {
          reply = response.text();
        } catch (e) {
          // response.text() could throw if there are only function calls
        }

        // Auto Continuation loop
        let currentResponse = response;
        let finishReason = (currentResponse as any).candidates?.[0]?.finishReason;
        let continuationLimit = 3;

        while (finishReason === 'MAX_TOKENS' && continuationLimit > 0) {
          logger.warn(`[Gemini] ⚠️ [Token 截断] 命中 MAX_TOKENS 墙，正在全自动续传... (余量 ${continuationLimit})`);
          const continueResult = await chat.sendMessage("请继续你刚刚未说完的话 (Continue exactly where you left off)");
          currentResponse = continueResult.response;
          try {
            reply += currentResponse.text();
          } catch (e) {}
          finishReason = (currentResponse as any).candidates?.[0]?.finishReason;
          continuationLimit--;
        }

        let functionCall: any = null;
        if (typeof (response as any).functionCalls === 'function') {
          const calls = (response as any).functionCalls();
          if (calls && calls.length > 0) functionCall = calls[0];
        } else if ((response as any).functionCall) {
          functionCall = typeof (response as any).functionCall === 'function' ? (response as any).functionCall() : (response as any).functionCall;
        }

        let downgradedMsg = '';
        if (level !== preferredLevel) {
          downgradedMsg = `⚠️ [AgentOS警报：API降级通知。原定模型 ${preferredLevel} 异常，已静默降级至 ${level} (${modelName}) 应急响应]\n\n`;
        }

        return {
          text: downgradedMsg + reply,
          functionCall
        };
      } catch (error: any) {
        logger.error(`[Gemini] Error: ${error.message}`);
        logger.warn(`[Gemini] ⚠️ ${level} 模型调用失败，尝试降级...`);
        lastError = error;
      }
    }

    throw new Error(`所有模型降级尝试均失败。最后错误: ${lastError?.message}`);
  }
}
