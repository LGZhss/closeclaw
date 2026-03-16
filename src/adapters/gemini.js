import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';
import { LLMAdapter } from './base.js';
import { log } from '../utils/logger.js';
import { writeWsFile, readWsFile } from '../utils/utils.js';

const genAI = new GoogleGenerativeAI(config.apiKeys?.gemini || process.env.GEMINI_API_KEY);

// 模型配置
const MODELS = {
  pro: 'gemini-1.5-pro',
  flash: 'gemini-1.5-flash',
  lite: 'gemini-1.0-pro'
};

export class GeminiAdapter extends LLMAdapter {
    async chat({ systemInstruction, history, message, tools, preferredLevel = 'lite' }) {
        // 降级链设计 (优先级回退)
        let fallbackChain = [];
        if (preferredLevel === 'pro') {
            fallbackChain = ['pro', 'flash', 'lite'];
        } else if (preferredLevel === 'flash') {
            fallbackChain = ['flash', 'lite', 'pro']; // flash 也可以降级 lite 或升级尝试 pro
        } else {
            fallbackChain = ['lite', 'flash', 'pro'];
        }

        let lastError = null;

        for (const level of fallbackChain) {
            if (!MODELS[level]) continue;
            const modelName = MODELS[level];

            try {
                const modelOpts = { model: modelName, systemInstruction };
                if (tools && tools.length > 0) {
                    modelOpts.tools = [{ functionDeclarations: tools }];
                }
                const ai = genAI.getGenerativeModel(modelOpts);
                const chat = ai.startChat({ history });

                log(`[Gemini] CHAT [${level}/${modelName}]: ${message.slice(0, 60)}`, 'DEBUG');

                const result = await chat.sendMessage(message);
                const response = result.response;

                let reply = '';
                try {
                    reply = response.text();
                } catch (e) {
                    // response.text() could throw if there are only function calls
                }

                // 无感自动断点续传检测 (Auto Continuation loop)
                let currentResponse = response;
                let finishReason = currentResponse.candidates?.[0]?.finishReason;
                let continuationLimit = 3; // 防止无限死循环

                while (finishReason === 'MAX_TOKENS' && continuationLimit > 0) {
                    log(`[Gemini] ⚠️ [Token 截断] 命中 MAX_TOKENS 墙，正在底层全自动续传... (余量 ${continuationLimit})`, 'WARN');
                    const continueResult = await chat.sendMessage("请继续你刚刚未说完的话 (Continue exactly where you left off)");
                    currentResponse = continueResult.response;
                    try {
                        reply += currentResponse.text();
                    } catch (e) { }
                    finishReason = currentResponse.candidates?.[0]?.finishReason;
                    continuationLimit--;
                }

                // Get function calls
                let functionCall = null;
                if (typeof response.functionCalls === 'function') {
                    const calls = response.functionCalls();
                    if (calls && calls.length > 0) functionCall = calls[0];
                } else if (response.functionCall) {
                    functionCall = typeof response.functionCall === 'function' ? response.functionCall() : response.functionCall;
                }

                // 记录调用配额使用
                const today = new Date().toISOString().slice(0, 10);
                const logLine = `[${new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' })}] CloseClaw 使用 ${level}（${modelName}）\n`;
                await writeWsFile(`memory/${today}.md`,
                    (await readWsFile(`memory/${today}.md`).catch(() => '')) + logLine
                );

                let downgradedMsg = '';
                if (level !== preferredLevel) {
                    downgradedMsg = `⚠️ [AgentOS警报：API降级通知。原定模型 ${preferredLevel} 异常，已静默降级至 ${level} (${modelName}) 应急响应]\n\n`;
                }

                return {
                    text: downgradedMsg + reply,
                    level,
                    model: modelName,
                    functionCall
                };
            } catch (error) {
                log(`[Gemini] Error: ${error.message}`, 'ERROR');
                log(`[Gemini] ⚠️ ${level} 模型调用失败 (${error.message})，尝试降级...`, 'WARN');
                lastError = error;
            }
        }

        throw new Error(`所有模型降级尝试均失败。最后错误: ${lastError?.message}`);
    }
}
