/**
 * Unified Tool Registry (MCP 工具统一注册表)
 */

import { 
  getToolsForLLM, 
  findToolByAlias, 
  findToolByName 
} from './tool-definitions.js';
import { logger } from '../logger.js';
import { 
  executeSystemCommand, 
  readWsFile, 
  writeWsFile, 
  fetchUrl, 
  runGit
} from '../utils/utils.js';
import { cliAnything } from './cli-anything.js';

export class ToolRegistry {
  private handlers: Map<string, Function>;

  constructor() {
    this.handlers = new Map();
    this._bindHandlers();
  }

  private _bindHandlers() {
    this.handlers.set('execCommand', this.execCommand.bind(this));
    this.handlers.set('readFile', this.readFile.bind(this));
    this.handlers.set('writeFile', this.writeFile.bind(this));
    this.handlers.set('fetchUrl', this.fetchUrl.bind(this));
    this.handlers.set('gitBackup', this.gitBackup.bind(this));
    this.handlers.set('gitSync', this.gitSync.bind(this));
    this.handlers.set('cliAnything', this.cliAnything.bind(this));
  }

  async executeByCommand(rawText: string, context: any = {}) {
    const text = rawText.trim();
    if (!text.startsWith('/')) return { result: null, tool: null };

    const parts = text.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const tool = findToolByAlias(cmd);
    if (!tool) return { result: null, tool: null };

    const argsObj = this._parseArgsToObject(tool, args, rawText);
    const result = await this.executeByName(tool.name, argsObj, context);
    return { result, tool };
  }

  async executeByName(name: string, argsObj: any = {}, context: any = {}) {
    const tool = findToolByName(name);
    if (!tool) {
      logger.warn(`[ToolRegistry] Unknown tool: ${name}`);
      return `❌ 未知工具: ${name}`;
    }

    const handler = this.handlers.get(tool.handler);
    if (!handler) {
      logger.error(`[ToolRegistry] No handler for: ${tool.handler}`);
      return `❌ 工具处理器未注册: ${tool.handler}`;
    }

    try {
      logger.debug(`[ToolRegistry] Executing: ${name}`);
      return await handler(argsObj, context);
    } catch (e: any) {
      logger.error(`[ToolRegistry] Error in ${name}: ${e.message}`);
      return `❌ 工具执行失败: ${e.message}`;
    }
  }

  getToolsForLLM() {
    return getToolsForLLM();
  }

  private _parseArgsToObject(tool: any, args: string[], rawText: string) {
    const props = tool.parameters.properties || {};
    const propNames = Object.keys(props);

    if (tool.name === 'write_file') {
      const match = rawText.match(/^\/write\s+(\S+)\s+([\s\S]*)$/i);
      if (match) {
        return { filePath: match[1], content: match[2] };
      }
    }

    if (tool.name === 'execute_command') {
      return { command: args.join(' ') };
    }

    const result: any = {};
    propNames.forEach((prop, i) => {
      if (args[i] !== undefined) {
        result[prop] = args[i];
      }
    });
    return result;
  }

  // ============ 工具实现 ============

  private async execCommand({ command }: any) {
    if (!command) return '用法：/exec <PowerShell命令>';
    return await executeSystemCommand(command);
  }

  private async readFile({ filePath }: any) {
    if (!filePath) return '用法：/read <相对工作区路径>';
    return await readWsFile(filePath);
  }

  private async writeFile({ filePath, content }: any) {
    if (!filePath) return '用法：/write <相对路径> <内容>';
    const r = await writeWsFile(filePath, content || '');
    return r === 'OK' ? `✅ 已写入 ${filePath}` : `❌ ${r}`;
  }

  private async fetchUrl({ url }: any) {
    if (!url) return '用法：/fetch <URL>';
    return await fetchUrl(url);
  }

  private async gitBackup({ message }: any) {
    return await runGit('backup', message);
  }

  private async gitSync() {
    return await runGit('sync');
  }

  private async cliAnything(args: any) {
    const result = await cliAnything(args);
    return result.success ? `🔧 **CLI-Anything 执行结果**\n${result.output}` : `❌ 失败: ${result.error}`;
  }
}

export const toolRegistry = new ToolRegistry();
