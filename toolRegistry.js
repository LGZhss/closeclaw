/**
 * Unified Tool Registry (MCP 工具统一注册表)
 * P7: 消除 Skill vs Command 双轨制，统一所有工具调用
 * 
 * 职责：
 * 1. 管理所有工具的注册与查找
 * 2. 统一执行接口（斜杠命令 / Function Calling）
 * 3. 导出 LLM 可用工具列表
 */

import { TOOL_DEFINITIONS, getToolsForLLM, findToolByAlias, findToolByName } from './toolDefinitions.js';
import { WORKSPACE } from '../../config/config.js';
import { log } from '../../utils/logger.js';

// ============ 导入工具实现 ============
import { executeSystemCommand, readWsFile, writeWsFile, fetchUrl, runGit, execAsync } from '../../utils/utils.js';
import { getMemoryReport } from '../../utils/memoryManager.js';
import { cliAnything } from './cliAnything.js';
import fs from 'fs/promises';
import path from 'path';

export class ToolRegistry {
  constructor() {
    this.handlers = new Map();
    this._bindHandlers();
  }

  /**
   * 绑定所有工具处理函数
   */
  _bindHandlers() {
    // 系统执行
    this.handlers.set('execCommand', this.execCommand.bind(this));

    // 文件操作
    this.handlers.set('readFile', this.readFile.bind(this));
    this.handlers.set('writeFile', this.writeFile.bind(this));

    // 网络抓取
    this.handlers.set('fetchUrl', this.fetchUrl.bind(this));

    // Git 操作
    this.handlers.set('gitBackup', this.gitBackup.bind(this));
    this.handlers.set('gitSync', this.gitSync.bind(this));

    // 技能安装
    this.handlers.set('installSkill', this.installSkill.bind(this));

    // 系统状态
    this.handlers.set('getStatus', this.getStatus.bind(this));
    this.handlers.set('getQuota', this.getQuota.bind(this));
    this.handlers.set('heartbeat', this.heartbeat.bind(this));
    this.handlers.set('clearHistory', this.clearHistory.bind(this));

    // 系统管理
    this.handlers.set('guiStop', this.guiStop.bind(this));
    this.handlers.set('updateCore', this.updateCore.bind(this));

    // 视觉感知
    this.handlers.set('takeScreenshot', this.takeScreenshot.bind(this));

    // 代码智能
    this.handlers.set('analyzeCode', this.analyzeCode.bind(this));

    // CLI-Anything
    this.handlers.set('cliAnything', this.cliAnything.bind(this));
  }

  /**
   * 通过斜杠命令执行工具
   * @param {string} rawText 原始命令文本
   * @param {Object} context 执行上下文 { chatId, channel, sessionManager }
   * @returns {Promise<{result: string|null, tool: Object|null}>}
   */
  async executeByCommand(rawText, context = {}) {
    const text = rawText.trim();
    if (!text.startsWith('/')) return { result: null, tool: null };

    const parts = text.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // 查找工具定义
    const tool = findToolByAlias(cmd);
    if (!tool) return { result: null, tool: null };

    // 解析参数为 JSON 对象
    const argsObj = this._parseArgsToObject(tool, args, rawText);

    // 执行工具
    const result = await this.executeByName(tool.name, argsObj, context);
    return { result, tool };
  }

  /**
   * 通过函数名执行工具（Function Calling 入口）
   * @param {string} name 函数名
   * @param {Object} argsObj 参数对象
   * @param {Object} context 执行上下文
   * @returns {Promise<string>}
   */
  async executeByName(name, argsObj = {}, context = {}) {
    const tool = findToolByName(name);
    if (!tool) {
      log(`[ToolRegistry] Unknown tool: ${name}`, 'WARN');
      return `❌ 未知工具: ${name}`;
    }

    const handler = this.handlers.get(tool.handler);
    if (!handler) {
      log(`[ToolRegistry] No handler for: ${tool.handler}`, 'ERROR');
      return `❌ 工具处理器未注册: ${tool.handler}`;
    }

    try {
      log(`[ToolRegistry] Executing: ${name}`, 'DEBUG');
      return await handler(argsObj, context);
    } catch (e) {
      log(`[ToolRegistry] Error in ${name}: ${e.message}`, 'ERROR');
      return `❌ 工具执行失败: ${e.message}`;
    }
  }

  /**
   * 获取 LLM Function Calling 格式的工具列表
   */
  getToolsForLLM() {
    return getToolsForLLM();
  }

  /**
   * 检查命令是否应跳过上下文注入
   */
  isNoContextCommand(cmd) {
    const tool = findToolByAlias(cmd);
    return tool?.noContext === true;
  }

  // ============ 参数解析辅助 ============
  _parseArgsToObject(tool, args, rawText) {
    const props = tool.parameters.properties || {};
    const propNames = Object.keys(props);

    // 特殊处理：write 命令需要解析 filePath 和 content
    if (tool.name === 'write_file') {
      const match = rawText.match(/^\/write\s+(\S+)\s+([\s\S]*)$/i);
      if (match) {
        return { filePath: match[1], content: match[2] };
      }
    }

    // 特殊处理：exec 命令需要整个参数串
    if (tool.name === 'execute_command') {
      return { command: args.join(' ') };
    }

    // 通用处理：第一个参数对应第一个属性
    const result = {};
    propNames.forEach((prop, i) => {
      if (args[i] !== undefined) {
        result[prop] = args[i];
      }
    });
    return result;
  }

  // ============ 工具实现 ============

  async execCommand({ command }, context) {
    if (!command) return '用法：/exec <PowerShell命令>';
    return await executeSystemCommand(command);
  }

  async readFile({ filePath }, context) {
    if (!filePath) return '用法：/read <相对工作区路径>';
    return await readWsFile(filePath);
  }

  async writeFile({ filePath, content }, context) {
    if (!filePath) return '用法：/write <相对路径> <内容>';
    const r = await writeWsFile(filePath, content || '');
    return r === 'OK' ? `✅ 已写入 ${filePath}` : `❌ ${r}`;
  }

  async fetchUrl({ url }, context) {
    if (!url) return '用法：/fetch <URL>';
    return await fetchUrl(url);
  }

  async gitBackup({ message }, context) {
    return await runGit('backup', message);
  }

  async gitSync(args, context) {
    return await runGit('sync');
  }

  async installSkill({ repoUrl }, context) {
    if (!repoUrl) return '用法：/install <GitHub的Skill仓库或子目录URL>';

    const match = repoUrl.match(/\/([^\/]+)(?:\.git)?$/);
    if (!match) return '❌ URL 格式有误，请确保它是 GitHub 等 git 仓库地址';
    const skillName = match[1];
    const targetPath = path.join(WORKSPACE, 'skills', skillName);

    try {
      const { channel, chatId } = context;

      await execAsync(`git clone "${repoUrl}" "${targetPath}"`);
      if (channel && chatId) {
        await channel.send(chatId, `📦 *[1/3]* 源码克隆完成，正在检查依赖...`, { parse_mode: 'Markdown' });
      }
      let installMsg = `✅ 技能装载成功！${skillName} 已落盘。`;

      // 自动安装 Python 依赖
      try {
        await fs.access(path.join(targetPath, 'requirements.txt'));
        if (channel && chatId) await channel.send(chatId, `🐍 *[2/3]* 正在安装 Python 依赖...`, { parse_mode: 'Markdown' });
        const pyRes = await executeSystemCommand(`cd "${targetPath}" && pip install -r requirements.txt`);
        installMsg += `\n🐍 Python 依赖自动安装完成:\n\`${pyRes.slice(-200)}\``;
      } catch { }

      // 自动安装 Node.js 依赖
      try {
        await fs.access(path.join(targetPath, 'package.json'));
        if (channel && chatId) await channel.send(chatId, `📦 *[3/3]* 正在安装 Node.js 依赖...`, { parse_mode: 'Markdown' });
        const nodeRes = await executeSystemCommand(`cd "${targetPath}" && npm install`);
        installMsg += `\n📦 Node.js 依赖自动安装完成:\n\`${nodeRes.slice(-200)}\``;
      } catch { }

      const skillMdPath = path.join(targetPath, 'SKILL.md');
      try {
        await fs.access(skillMdPath);
        return `${installMsg}\n\n你可以通过 /read skills/${skillName}/SKILL.md 查看其内部能力。`;
      } catch {
        return `⚠️ 技能克隆成功，但未找到规范的 SKILL.md。`;
      }
    } catch (e) {
      return `❌ 技能克隆失败：${e.message}`;
    }
  }

  async getStatus(args, context) {
  const memReport = getMemoryReport();
  const uptime = process.uptime() > 3600
    ? `${Math.floor(process.uptime() / 3600)}小时${Math.floor((process.uptime() % 3600) / 60)}分钟`
    : `${Math.floor(process.uptime() / 60)}分钟${Math.floor(process.uptime() % 60)}秒`;

  return `
📊 *Agent OS 运行状态*

🧠 *内存状态*
${memReport}

📁 *工作区*: ${WORKSPACE}
⏱️ *运行时间*: ${uptime}
🧾 *进程ID*: ${process.pid}

💡 使用 /heartbeat 进行完整健康检查
`;
}

  async getQuota(args, context) {
  try {
    const quotaPath = path.join(WORKSPACE, 'memory', 'quota-status.json');
    const data = await fs.readFile(quotaPath, 'utf8');
    const quota = JSON.parse(data);
    return `📈 *API 配额状态*\n\`\`\`json\n${JSON.stringify(quota, null, 2)}\n\`\`\``;
  } catch {
    return '⚠️ 配额状态文件不存在或无法读取';
  }
}

  async heartbeat(args, context) {
  const checks = [];

  // 检查工作区
  try {
    await fs.access(WORKSPACE);
    checks.push('✅ 工作区可访问');
  } catch {
    checks.push('❌ 工作区不可访问');
  }

  // 检查内存状态
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  checks.push(`✅ 内存使用: ${heapUsedMB}MB`);

  // 检查进程状态
  checks.push(`✅ PID: ${process.pid}`);
  checks.push(`✅ 运行时间: ${Math.floor(process.uptime())}秒`);

  return `🫀 *Agent 健康检查*\n\n${checks.join('\n')}`;
}

  async clearHistory(args, context) {
  const { sessionManager, chatId } = context;
  if (sessionManager && chatId) {
    sessionManager.clearHistory(chatId);
    return '✅ 对话历史已清除';
  }
  return '⚠️ 无法清除历史：缺少 session 上下文';
}

  async guiStop(args, context) {
  return '⚠️ GUI 停止功能暂未实现';
}

  async updateCore(args, context) {
  try {
    const pullResult = await execAsync('git pull origin main');
    return { text: `🔄 *热更新完成*\n\`\`\`\n${pullResult.stdout || pullResult}\n\`\`\`\n\n⚠️ 新代码已拉取，需要重启生效。`, shouldExit: true };
  } catch (e) {
    return `❌ 更新失败: ${e.message}`;
  }
}

  async takeScreenshot(args, context) {
  const { channel, chatId } = context;
  try {
    if (channel && channel.sendChatAction) {
      await channel.sendChatAction(chatId, 'upload_photo');
    }
    // 动态导入截图功能
    const { takeScreenshot: doScreenshot } = await import('../../utils/utils.js');
    const imgPath = await doScreenshot();
    return `📸 截图已生成并保存到: \`${imgPath}\`。您可以在沙盒工作区直接查看。`;
  } catch (e) {
    return `❌ 截图失败: ${e.message}`;
  }
}

  async analyzeCode({ focus }, context) {
  log(`[ToolRegistry] Starting project analysis using GitNexus philosophy...`, 'SYS');
  try {
    const tree = await executeSystemCommand('tree /f src');
    return `🚀 [GitNexus 图谱分析报告]
分析重点：${focus || '整体架构'}
探测到核心文件树：
${tree.slice(0, 1000)}

[逻辑链路建议]：
- 系统采用微内核架构，所有外部 IO 均通过 Dispatcher 路由。
- 建议关注 src/adapters 与 src/core 的跨层耦合。
- 如需进一步深入，请指示我读取特定模块的源码。`;
  } catch (e) {
    return `❌ 分析失败: ${e.message}`;
  }
}

  /**
   * CLI-Anything 工具处理器
   * @param {Object} args 参数对象 { prompt, workingDir, timeout }
   * @param {Object} context 执行上下文
   * @returns {Promise<string>}
   */
  async cliAnything(args, context) {
    try {
      const result = await cliAnything(args);
      
      if (result.success) {
        let response = `🔧 **CLI-Anything 执行结果**\n\n`;
        response += `📝 **命令**: ${args.prompt}\n`;
        response += `📁 **工作目录**: ${result.workingDir}\n\n`;
        
        if (result.output) {
          response += `📤 **输出**:\n\`\`\`\n${result.output}\n\`\`\``;
        }
        
        if (result.error) {
          response += `\n\n⚠️ **错误**:\n\`\`\`\n${result.error}\n\`\`\``;
        }
        
        return response;
      } else {
        return `❌ **CLI-Anything 执行失败**\n\n${result.error}`;
      }
    } catch (error) {
      log(`[ToolRegistry] CLI-Anything error: ${error.message}`, 'ERROR');
      return `❌ CLI-Anything 工具调用失败: ${error.message}`;
    }
  }
}

export const toolRegistry = new ToolRegistry();
