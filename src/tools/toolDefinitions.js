/**
 * MCP Tool Definitions (Unified JSON Schema)
 * P7: 统一工具抽象层 - 所有工具的 JSON Schema 定义
 * 
 * 每个工具包含：
 * - name: 工具唯一标识
 * - description: 工具描述（供 LLM 理解）
 * - parameters: JSON Schema 参数定义
 * - handler: 执行函数引用名
 * - aliases: 命令别名（斜杠命令）
 * - noContext: 是否跳过上下文注入
 */

export const TOOL_DEFINITIONS = [
  // ============ 系统执行类 ============
  {
    name: 'execute_command',
    description: '在系统终端执行 PowerShell 命令。用于运行脚本、管理进程、安装依赖等系统操作。',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '要执行的 PowerShell 命令'
        }
      },
      required: ['command']
    },
    handler: 'execCommand',
    aliases: ['/exec'],
    noContext: false
  },

  // ============ 文件操作类 ============
  {
    name: 'read_file',
    description: '读取工作区内的文件内容。支持读取代码、配置文件、日志等。',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '相对于工作区的文件路径'
        }
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
        filePath: {
          type: 'string',
          description: '相对于工作区的文件路径'
        },
        content: {
          type: 'string',
          description: '要写入的文件内容'
        }
      },
      required: ['filePath', 'content']
    },
    handler: 'writeFile',
    aliases: ['/write'],
    noContext: false
  },

  // ============ 网络抓取类 ============
  {
    name: 'fetch_url',
    description: '抓取指定 URL 的网页内容。支持 HTTP/HTTPS 请求，返回文本内容。',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '要抓取的 URL 地址'
        }
      },
      required: ['url']
    },
    handler: 'fetchUrl',
    aliases: ['/fetch'],
    noContext: false
  },

  // ============ Git 操作类 ============
  {
    name: 'git_backup',
    description: '执行 Git 备份：自动 add、commit 当前工作区变更。',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '提交信息（可选，默认自动生成）'
        }
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

  // ============ 技能安装类 ============
  {
    name: 'install_skill',
    description: '从 GitHub 安装新技能。自动克隆仓库并安装依赖。',
    parameters: {
      type: 'object',
      properties: {
        repoUrl: {
          type: 'string',
          description: 'GitHub 仓库 URL'
        }
      },
      required: ['repoUrl']
    },
    handler: 'installSkill',
    aliases: ['/install'],
    noContext: false
  },

  // ============ 系统状态类 ============
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
    noContext: true,  // 状态命令不注入上下文
    skipVerify: true  // BOLT: 只读工具跳过自检
  },
  {
    name: 'get_quota',
    description: '获取 API 配额使用情况。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'getQuota',
    aliases: ['/quota'],
    noContext: true,
    skipVerify: true
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
    noContext: true,
    skipVerify: true
  },
  {
    name: 'clear_history',
    description: '清除当前会话的对话历史记录。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'clearHistory',
    aliases: ['/clear'],
    noContext: true
  },

  // ============ 系统管理类 ============
  {
    name: 'gui_stop',
    description: '停止 Agent GUI 服务。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'guiStop',
    aliases: ['/gui_stop'],
    noContext: true
  },
  {
    name: 'update_core',
    description: '热更新 Agent 核心代码，从远程拉取最新版本。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'updateCore',
    aliases: ['/update_core'],
    noContext: true
  },

  // ============ 视觉感知类 ============
  {
    name: 'take_screenshot',
    description: '截取当前屏幕截图并保存到工作区。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: 'takeScreenshot',
    aliases: ['/screenshot'],
    noContext: false
  },

  // ============ 代码智能类 ============
  {
    name: 'analyze_code',
    description: '基于 GitNexus 理念分析项目代码结构，生成架构拓扑报告。',
    parameters: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          description: '分析重点（可选，如 "依赖关系"、"调用链路" 等）'
        }
      },
      required: []
    },
    handler: 'analyzeCode',
    aliases: ['/analyze'],
    noContext: false
  },

  // ============ CLI-Anything类 ============
  {
    name: 'cli_anything',
    description: '使用自然语言执行命令行操作，基于CLI-Anything工具。将自然语言描述转换为具体的CLI命令并执行。',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '自然语言命令描述，如"列出当前目录的文件"、"创建名为test的目录"等'
        },
        workingDir: {
          type: 'string',
          description: '工作目录（相对于workspace，默认为当前目录）',
          default: '.'
        },
        timeout: {
          type: 'number',
          description: '命令超时时间（毫秒，默认30秒）',
          default: 30000
        }
      },
      required: ['prompt']
    },
    handler: 'cliAnything',
    aliases: ['/cli', '/command'],
    noContext: false
  }
];

/**
 * 获取 LLM Function Calling 格式的工具定义
 * @returns {Array} Gemini/OpenAI 兼容的 tools 数组
 */
export function getToolsForLLM() {
  return TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

/**
 * 根据斜杠命令查找工具定义
 * @param {string} slashCmd 斜杠命令（如 /exec）
 * @returns {Object|null} 工具定义或 null
 */
export function findToolByAlias(slashCmd) {
  const normalized = slashCmd.toLowerCase();
  return TOOL_DEFINITIONS.find(t => 
    t.aliases.some(a => a.toLowerCase() === normalized)
  ) || null;
}

/**
 * 根据函数名查找工具定义
 * @param {string} name 函数名（如 execute_command）
 * @returns {Object|null} 工具定义或 null
 */
export function findToolByName(name) {
  return TOOL_DEFINITIONS.find(t => t.name === name) || null;
}
