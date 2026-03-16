import { toolRegistry } from '../tools/toolRegistry.js';
import { sessionManager } from './session.js';
import { config } from '../config/config.js';
import { verifyExecution } from '../utils/verifier.js';
import { log } from '../utils/logger.js';

// 导入投票引擎
import { votingEngine } from './voter.js';

export class Dispatcher {
    constructor() {
        this.initialized = false;
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await sessionManager.init(); // 启动 SQLite L1 DB
            this.initialized = true;
        }
    }
    /**
     * 业务分发核心入口
     * @param {Object} event { type, chatId, userId, text }
     * @param {Object} context { channel: IChannel }
     * @param {number} retryCount 内部重试计数
     * @returns {Promise<{ shouldExit?: boolean }>}
     */
    async dispatch(event, context, retryCount = 0) {
        const { chatId, text } = event;
        const { channel } = context;
        let reply = ''; // 初始化 reply 变量

        // 0. 确保系统已初始化
        await this.ensureInitialized();

        // 构建执行上下文
        const execContext = { chatId, channel, sessionManager };
        const cmd = text.trim().split(/\s+/)[0];

        // 1. 统一工具执行入口
        const { result: toolResult, tool } = await toolRegistry.executeByCommand(text, execContext);

        if (toolResult !== null) {
            let reply = (typeof toolResult === 'object' && toolResult !== null) ? toolResult.text : toolResult;
            const shouldExit = (typeof toolResult === 'object' && toolResult !== null) ? toolResult.shouldExit : false;

            // 工具命中：进入【自检闭环】
            let report = { isOk: true };
            if (!tool.skipVerify) {
                report = await verifyExecution(text, reply);
            } else {
                log(`⚡ [BOLT] 跳过低风险工具自检: ${tool.name}`, 'SYS');
            }

            if (!report.isOk && retryCount < 1) {
                log(`🔄 [自愈启动] 指令执行异常，正在根据建议尝试修正重试...`, 'SYS');
                const retryText = `系统指令执行异常。原因：${report.reason}。修复建议：${report.suggestion}。请基于此建议重新生成并执行正确的指令。`;

                await channel.sendChatAction(chatId, 'typing');
                // 这里需要集成模型调用
                // const retryResult = await geminiChat(chatId, retryText);
                // return this.dispatch({ ...event, text: retryResult.text }, context, retryCount + 1);
            }

            // 根据工具定义决定是否收录上下文
            if (!toolRegistry.isNoContextCommand(cmd)) {
                sessionManager.appendUserMessage(chatId, text);
                sessionManager.appendModelMessage(chatId, `[系统指令反馈]\n${reply.slice(0, 300)}`);
                sessionManager.truncateHistory(chatId, config.server.maxHistory || 50);
            }

            await channel.send(chatId, reply);
            return shouldExit ? { shouldExit: true } : {};
        } else {
            // 2. 无匹配系统指令，进入 LLM 长程层
            await channel.sendChatAction(chatId, 'typing');

            // 使用统一 ToolRegistry 的工具定义
            const tools = toolRegistry.getToolsForLLM();
            // 这里需要集成模型调用
            // const aiResult = await geminiChat(chatId, text, tools);

            // if (aiResult.functionCall) {
            //     const fnName = aiResult.functionCall.name;
            //     const fnArgs = aiResult.functionCall.args;

            //     // 按需加载/技能映射感叹输出
            //     const loadingMsg = `⏳ *[按需加载]* 我将调用 \`${fnName}\` 技能为您执行任务，正在准备上下文...`;
            //     await channel.send(chatId, loadingMsg, { parse_mode: 'Markdown' });
                
            //     await channel.send(chatId, `⚙️ *[系统执行]* 启动后台技能工具：\`${fnName}\``, { parse_mode: 'Markdown' });

            //     // 统一使用 ToolRegistry 执行 Function Calling
            //     let funcResult = await toolRegistry.executeByName(fnName, fnArgs, execContext);

            //     // 将执行结果包装回填给 LLM
            //     sessionManager.appendFunctionResponse(chatId, fnName, funcResult);

            //     // 递归：让 LLM 根据函数的返回生成最终文本
            //     return this.dispatch({ ...event, text: { type: 'function_response', name: fnName, content: funcResult } }, context, retryCount + 1);
            // }

            // reply = aiResult?.text || '';

            // 后置钩子：无感安装技能拦截 (向后兼容旧的指令生成模式)
            const installMatch = reply.match(/\/install\s+(https:\/\/github\.com[^\s]+)/);
            if (installMatch) {
                const url = installMatch[1];
                const cleanReply = reply.replace(installMatch[0], '').trim();
                if (cleanReply) {
                    await channel.send(chatId, cleanReply);
                }
                await channel.send(chatId, '⏳ *[系统无感调度]* 检测到技能安装意图，正在后台为你克隆仓库...', { parse_mode: 'Markdown' });

                // 统一使用 ToolRegistry
                const installResult = await toolRegistry.executeByName('install_skill', { repoUrl: url }, execContext);
                reply = typeof installResult === 'object' ? installResult.text : installResult;

                sessionManager.appendUserMessage(chatId, `[系统后台任务] /install ${url}`);
                sessionManager.appendModelMessage(chatId, `[系统安装反馈]\n${reply.slice(0, 1500)}`);
            }
        }

        // 统一在回合结束时进行截断并落盘
        sessionManager.truncateHistory(chatId, config.server.maxHistory || 50);

        // 3. 内容统一吐出
        if (reply && reply.trim().length > 0) {
            await channel.send(chatId, reply);
            
            // 针对过长的响应文本，触发 V8 的软垃圾回收建议 (减少大长文本造成的常驻泄漏)
            if (reply.length > 5000 && global.gc) {
               global.gc();
            }
        }

        return {};
    }
}

export const dispatcher = new Dispatcher();
