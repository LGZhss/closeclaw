/**
 * MCP Tool Definitions (Unified JSON Schema)
 */

export const TOOL_DEFINITIONS = [
  {
    name: 'execute_command',
    description: '在系统终端执行 PowerShell 命令。用于运行脚本、管理进程、安装依赖等系统操作。',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的 PowerShell 命令' }
      },
      required: ['command']
    },
    handler: 'execCommand',
    aliases: ['/exec'],
    noContext: false
  },
  {
    name: 'read_file',
    description: '读取工作区内的文件内容。支持读取代码、配置文件、日志等。',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '相对于工作区的文件路径' }
      },
      required: ['filePath']
    },
    handler: 'readFile',
    aliases: ['/read'],
    noContext: false
  },
  {
    name: 'write_file',
    description: '将内容写入工作区内的文件。支持创建新文件或覆盖现有文件。',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '相对于工作区的文件路径' },
        content: { type: 'string', description: '要写入的文件内容' }
      },
      required: ['filePath', 'content']
    },
    handler: 'writeFile',
    aliases: ['/write'],
    noContext: false
  },
  {
    name: 'fetch_url',
    description: '抓取指定 URL 的网页内容。支持 HTTP/HTTPS 请求，返回文本内容。',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '要抓取的 URL 地址' }
      },
      required: ['url']
    },
    handler: 'fetchUrl',
    aliases: ['/fetch'],
    noContext: false
  },
  {
    name: 'git_backup',
    description: '执行 Git 备份：自动 add、commit 当前工作区变更。',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '提交信息（可选，默认自动生成）' }
      },
      required: []
    },
    handler: 'gitBackup',
    aliases: ['/backup'],
    noContext: false
  },
  {
    name: 'git_sync',
    description: '执行 Git 同步：pull 最新代码并 push 本地变更。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'gitSync',
    aliases: ['/sync'],
    noContext: false
  },
  {
    name: 'get_status',
    description: '获取 Agent OS 运行状态，包括内存、工作区、运行时间等信息。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'getStatus',
    aliases: ['/status'],
    noContext: true
  },
  {
    name: 'heartbeat',
    description: '执行系统健康检查，验证所有核心组件状态。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'heartbeat',
    aliases: ['/heartbeat'],
    noContext: true
  },
  {
    name: 'cli_anything',
    description: '使用自然语言执行命令行操作。',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '自然语言命令描述' }
      },
      required: ['prompt']
    },
    handler: 'cliAnything',
    aliases: ['/cli'],
    noContext: false
  }
];

export function getToolsForLLM() {
  return TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

export function findToolByAlias(slashCmd: string) {
  const normalized = slashCmd.toLowerCase();
  return TOOL_DEFINITIONS.find(t => 
    t.aliases.some(a => a.toLowerCase() === normalized)
  ) || null;
}

export function findToolByName(name: string) {
  return TOOL_DEFINITIONS.find(t => t.name === name) || null;
}
