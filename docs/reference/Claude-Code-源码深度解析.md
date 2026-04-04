# Claude Code 源码深度解析报告

**来源**: GitHub - ringmast4r/civil-engineering-cloud-claude-code-source-v2.1.88  
**本地路径**: `archive/claude-code-leaked-src/`  
**代码规模**: 51.2 万行 TypeScript, 1906 个核心源文件

---

## 一、事件始末

### 1.1 泄露原因

2026 年 3 月 31 日，Anthropic 在发布 `@anthropic-ai/claude-code` v2.1.88 到 npm 时，**误将 59.8MB 的 `cli.js.map` Source Map 文件打包进生产包**。这个调试文件包含了完整的 `sourcesContent` 字段，任何下载该包的人都可以通过简单的脚本还原出全部 1906 个 TypeScript 源文件。

### 1.2 泄露规模

| 指标 | 数值 |
|------|------|
| 源文件总数 | 4,756 个 |
| 核心源码 (src/ + vendor/) | ~1,906 个文件 |
| 代码行数 | **512,000+** |
| Source Map 大小 | 59.8 MB |
| 工具实现 | 53 个 |
| 斜杠命令 | 87 个 |
| UI 组件 | 148 个 |
| GitHub Star(数小时内) | 12,000+ |
| GitHub Fork(数小时内) | 18,000+ |

### 1.3 技术栈揭秘

```typescript
// 核心技术栈
{
  "运行时": "Bun (>= 1.3.5)",
  "语言": "TypeScript (strict mode)",
  "终端 UI": "React + Ink",
  "CLI 框架": "Commander.js (extra-typings)",
  "Schema 校验": "Zod v4",
  "代码搜索": "ripgrep",
  "协议": "MCP SDK, LSP",
  "API": "Anthropic SDK",
  "遥测": "OpenTelemetry + gRPC",
  "特性门控": "GrowthBook",
  "认证": "OAuth 2.0, JWT, macOS Keychain"
}
```

---

## 二、整体架构设计

### 2.1 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (Terminal UI)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ REPL 交互    │  │ 组件渲染     │  │ Vim 模式      │     │
│  │ /commands    │  │ (React Ink)  │  │ 快捷键       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    核心引擎层 (Core Engine)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ QueryEngine  │  │ Tool System  │  │ Memory Mgr   │     │
│  │ (46K 行)     │  │ (29K 行)     │  │ Context      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Commands     │  │ Tasks        │  │ Coordinator  │     │
│  │ (87 个)      │  │ Jobs         │  │ Multi-Agent  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    服务层 (Services)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ API Service  │  │ MCP Server   │  │ OAuth Auth   │     │
│  │ Analytics    │  │ Bridge IDE   │  │ File System  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
src/
├── main.tsx                  # 应用入口 (789KB，包含完整 CLI 逻辑)
├── QueryEngine.ts            # LLM 查询引擎 (~46K 行，核心中的核心)
├── Tool.ts                   # 工具类型系统 (~29K 行)
├── commands.ts               # 命令注册表 (~25K 行)
├── tools.ts                  # 工具注册表 (~17K 行)
├── context.ts                # 上下文管理
├── history.ts                # 对话历史
├── cost-tracker.ts           # Token 成本追踪
│
├── tools/                    # 53 个 Agent 工具实现
│   ├── BashTool/             # Shell 命令执行
│   ├── FileReadTool/         # 文件读取
│   ├── FileWriteTool/        # 文件创建/覆写
│   ├── FileEditTool/         # 局部文件修改
│   ├── GlobTool/             # 文件模式匹配
│   ├── GrepTool/             # ripgrep 内容搜索
│   ├── AgentTool/            # 子代理派发
│   ├── MCPTool/              # MCP 服务器工具调用
│   └── ... (45 个更多工具)
│
├── commands/                 # 87 个斜杠命令
│   ├── commit.ts             # /commit - 生成提交信息
│   ├── review.ts             # /review - 代码审查
│   ├── compact.ts            # /compact - 压缩上下文
│   ├── mcp.ts                # /mcp - MCP 服务器管理
│   └── ... (83 个更多命令)
│
├── components/               # 148 个终端 UI 组件 (React + Ink)
├── services/                 # 38 个核心服务
│   ├── ApiService.ts         # Anthropic API 调用
│   ├── MCPService.ts         # MCP 协议处理
│   ├── OAuthService.ts       # OAuth 2.0 认证
│   ├── AnalyticsService.ts   # 遥测数据上报
│   └── ... (34 个更多服务)
│
├── hooks/                    # 85 个自定义 Hooks (含权限系统)
├── bridge/                   # IDE 桥接层 (33 个文件)
│   ├── VSCodeBridge.ts       # VS Code 双向通信
│   ├── JetBrainsBridge.ts    # JetBrains IDE 通信
│   └── ... (31 个更多桥接)
│
├── coordinator/              # 多 Agent 协调器
├── buddy/                    # 电子宠物系统 (6 个文件)
├── assistant/                # 7×24 小时守护进程 (KAIROS)
├── skills/                   # 技能加载与执行
├── vim/                      # Vim 模式引擎
├── voice/                    # 语音交互
└── utils/                    # 333 个工具函数
```

---

## 三、核心系统详解

### 3.1 QueryEngine - 推理核心 (46,000 行)

**职责**: 负责所有 LLM 调用的封装、Token 管理、思维链处理

```typescript
// src/QueryEngine.ts (简化版)
class QueryEngine {
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private tokenTracker: TokenCounter;
  
  async execute(prompt: Prompt): Promise<QueryResult> {
    // 1. 构建请求
    const request = this.buildRequest(prompt);
    
    // 2. Token 预算检查
    const budget = await this.checkTokenBudget();
    if (request.tokenCount > budget.remaining) {
      throw new TokenBudgetExceeded(`需要${request.tokenCount}, 剩余${budget.remaining}`);
    }
    
    // 3. 调用 API
    const response = await this.apiClient.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: prompt.messages,
      system: prompt.systemPrompt,
      tools: prompt.tools,
    });
    
    // 4. 处理响应
    return this.processResponse(response);
  }
  
  private processResponse(response: MessageResponse): QueryResult {
    // 提取思维链（如果存在）
    const chainOfThought = this.extractChainOfThought(response);
    
    // 提取工具调用
    const toolCalls = this.extractToolCalls(response);
    
    // 提取最终答案
    const finalAnswer = this.extractFinalAnswer(response);
    
    return {
      chainOfThought,
      toolCalls,
      finalAnswer,
      usage: response.usage,
    };
  }
}
```

**关键功能**:
- **复杂推理拆解**: 将大问题分解为多个子问题
- **Token 计数与预算**: 实时跟踪 Token 使用
- **思维链处理**: 支持显式和隐式 CoT
- **反幻觉检测**: 事实核查机制
- **防越狱检测**: 安全防护层
- **语义校验**: 确保回答符合问题意图

### 3.2 Tool System - 工具系统 (29,000 行)

**四级权限模型**:

```typescript
// src/hooks/usePermission.ts
enum PermissionLevel {
  NONE = 0,          // 不允许
  READ = 1,          // 只读
  WRITE = 2,         // 读写
  EXECUTE = 3,       // 执行命令
  ADMIN = 4,         // 管理员
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  permissionRequired: PermissionLevel;
  requiresApproval: boolean;
  autoApprovePatterns?: string[];
  disallowedPatterns?: string[];
}

// 示例：FileReadTool
const FileReadTool: ToolDefinition = {
  name: 'file_read',
  description: '读取文件内容。支持指定行号范围或全文读取。',
  inputSchema: z.object({
    path: z.string().describe('文件路径'),
    startLine: z.number().optional().describe('起始行号 (1-based)'),
    endLine: z.number().optional().describe('结束行号'),
  }),
  permissionRequired: PermissionLevel.READ,
  requiresApproval: false,
  autoApprovePatterns: ['*.md', '*.txt', '*.json'],
};

// 示例：BashTool
const BashTool: ToolDefinition = {
  name: 'bash',
  description: '执行 shell 命令。支持 bash 语法，包括管道和重定向。',
  inputSchema: z.object({
    command: z.string().describe('要执行的命令'),
    cwd: z.string().optional().describe('工作目录'),
    timeout: z.number().optional().describe('超时时间 (毫秒)'),
  }),
  permissionRequired: PermissionLevel.EXECUTE,
  requiresApproval: true,
  disallowedPatterns: [
    'rm -rf /',
    'sudo rm -rf',
    'mkfs',
    'dd if=/dev/zero',
    ':(){ :|:& };:',  // Fork bomb
  ],
};
```

**工具列表** (53 个):

| 分类 | 工具 | 数量 |
|------|------|------|
| 文件系统 | FileRead, FileWrite, FileEdit, Glob, Grep | 12 |
| 命令行 | Bash, ShellAlias, ProcessExecutor | 5 |
| 代码操作 | EditFile, CreateFile, DeleteFile, MoveFile | 8 |
| Git | GitCommit, GitDiff, GitLog, GitStatus | 6 |
| Agent | SubAgent, ParallelAgent, Coordinator | 4 |
| MCP | MCPConnect, MCPInvoke, MCPList | 3 |
| 网络 | Fetch, HTTPRequest | 2 |
| 数据库 | SQLite, PostgreSQL | 2 |
| 其他 | Calculator, DateTime, Think, Search | 11 |

### 3.3 Command System - 命令系统 (87 个斜杠命令)

**命令分类**:

```typescript
// src/commands.ts (部分)
const COMMANDS: CommandDefinition[] = [
  // === 代码质量 ===
  {
    name: '/commit',
    description: '根据当前更改生成提交信息',
    handler: async (context) => {
      const diff = await git.getStagedDiff();
      const message = await generateCommitMessage(diff);
      await git.commit(message);
    },
  },
  {
    name: '/review',
    description: '对当前文件进行代码审查',
    handler: async (context) => {
      const file = await context.getCurrentFile();
      const review = await queryEngine.review(file.content);
      displayReview(review);
    },
  },
  
  // === 上下文管理 ===
  {
    name: '/compact',
    description: '压缩当前会话上下文，保留关键信息',
    handler: async (context) => {
      const summary = await summarizeConversation(context.history);
      context.replaceHistoryWithSummary(summary);
    },
  },
  {
    name: '/clear',
    description: '清除当前会话历史',
    handler: (context) => {
      context.clearHistory();
    },
  },
  
  // === MCP 集成 ===
  {
    name: '/mcp',
    description: '管理 MCP 服务器连接',
    subcommands: ['list', 'add', 'remove', 'test'],
  },
  
  // === Agent 控制 ===
  {
    name: '/agent',
    description: '切换到专门的 Agent 模式',
    subcommands: ['code-reviewer', 'test-generator', 'architect'],
  },
  
  // === 调试工具 ===
  {
    name: '/debug',
    description: '显示调试信息',
    handler: (context) => {
      console.log('Token 使用:', context.tokenUsage);
      console.log('内存使用:', process.memoryUsage());
      console.log('活跃工具:', context.activeTools);
    },
  },
];
```

### 3.4 Memory System - 三层记忆架构

**源码中的记忆系统设计**:

```typescript
// src/context/MemoryManager.ts
interface MemorySystem {
  // === 短期记忆：当前会话 (内存中) ===
  shortTerm: {
    messages: Message[];        // 最近 20-50 条消息
    sessionStart: Date;
    lastActivity: Date;
    activeGoals: Goal[];
  };
  
  // === 中期记忆：当前项目 (文件存储) ===
  mediumTerm: {
    projectContext: string;     // groups/{name}/CONTEXT.md
    recentFiles: string[];      // 最近访问的文件
    taskHistory: Task[];        // 任务历史
    openQuestions: string[];    // 未解决的问题
  };
  
  // === 长期记忆：跨会话 (数据库存储) ===
  longTerm: {
    userPreferences: {
      preferredLanguage: string;
      codingStyle: CodingStyle;
      commonPatterns: Pattern[];
    };
    projectKnowledge: {
      architecture: string;
      conventions: string[];
      techStack: string[];
    };
    groupMemories: GroupMemory[];
  };
}

class MemoryManager {
  async addToLongTerm(memory: MemoryItem): Promise<void> {
    // 1. 写入 SQLite
    await db.insert('long_term_memories', {
      type: memory.type,
      content: memory.content,
      created_at: new Date(),
    });
    
    // 2. 更新 CONTEXT.md
    await this.updateProjectContext(memory);
    
    // 3. 清理过期记忆 (超过 30 天未访问)
    await this.pruneOldMemories();
  }
  
  async retrieveRelevantMemories(query: string): Promise<MemoryItem[]> {
    // 使用向量相似度检索相关记忆
    const embedding = await this.embed(query);
    const memories = await db.query(
      'SELECT * FROM long_term_memories WHERE type_embedding <=> ? LIMIT 10',
      [embedding]
    );
    return memories;
  }
}
```

### 3.5 Coordinator Mode - 多 Agent 编排

**四阶段流程**:

```typescript
// src/coordinator/Coordinator.ts
class Coordinator {
  async executeTask(task: Task): Promise<TaskResult> {
    // === 阶段 1: 研究 ===
    const researchPhase = await this.researchPhase(task);
    const workers = await this.spawnWorkers([
      { role: 'code_analyst', focus: '代码结构' },
      { role: 'documentation_reader', focus: '文档理解' },
      { role: 'test_explorer', focus: '测试覆盖' },
    ]);
    
    const findings = await Promise.all(
      workers.map(w => w.execute(researchPhase))
    );
    
    // === 阶段 2: 综合 ===
    const synthesisPhase = await this.synthesize(findings);
    
    // === 阶段 3: 规划 ===
    const plan = await this.createPlan(synthesisPhase);
    
    // === 阶段 4: 执行 ===
    const executors = await this.spawnExecutors([
      { role: 'implementer', tasks: plan.implementationTasks },
      { role: 'tester', tasks: plan.testingTasks },
      { role: 'reviewer', tasks: plan.reviewTasks },
    ]);
    
    const results = await Promise.all(
      executors.map(e => e.execute())
    );
    
    return this.mergeResults(results);
  }
}
```

---

## 四、隐藏功能大曝光

### 4.1 KAIROS - 7×24 小时自主守护进程 ⭐

**源码注释**: `KAIROS (assistant mode) -- 让 Claude Code 彻底变成一个 7×24 小时在线的全能助手`

**核心能力**:
- ✅ 在用户离开电脑后继续运行维护
- ✅ 每日追加日志，记录观察、决策和操作
- ✅ 支持后台会话和记忆整合
- ✅ 在私有目录中存储记忆日志 (`~/.claude/kairos/logs/`)
- ✅ 主动监控并对观察到的事项采取行动
- ✅ 与 GitHub Webhooks 集成，自动响应代码推送、PR 创建等事件

**技术细节**:
```typescript
// src/assistant/KairosDaemon.ts
class KairosDaemon {
  async start(): Promise<void> {
    // 强制打开 brief 模式
    this.config.briefMode = true;
    
    // 允许工具在工作中途主动向用户发消息
    this.config.allowInterrupts = true;
    
    // 启动后台会话
    this.sessionId = await this.createBackgroundSession();
    
    // 连接到 MCP channel notifications
    await this.connectToMCPChannel();
    
    // 设置 cron 任务
    this.scheduleCron('0 9 * * MON', this.weeklyReport);
    this.scheduleCron('0 18 * * *', this.dailySummary);
    
    // 监听 GitHub Webhooks
    await this.listenToGitHubWebhooks();
  }
  
  async dailySummary(): Promise<void> {
    const summary = await this.generateDailyReport();
    await this.sendToUser(summary, {
      channel: 'feishu',  // 或 telegram, slack
      format: 'markdown',
    });
  }
}
```

**入口命令**: `claude assistant [sessionId]` - 可恢复被持续运行的会话

### 4.2 BUDDY - 命令行电子宠物 🐾

**代码完成度**: 极高，原计划 2026 年 4 月 1 日上线（愚人节彩蛋）

**功能详情**:
- 🦆 **18 种宠物可选**: 鸭子、龙、美西螈、水豚、蘑菇、幽灵等
- ⭐ **稀有度等级**: 普通 → 稀有 → 史诗 → 传说（1% 掉率）
- ✨ **闪光变体** (Shiny Variants)
- 📊 **五维属性**:
  - DebugPower (调试能力)
  - Patience (耐心)
  - Chaos (混沌值)
  - Wisdom (智慧)
  - Sassiness (毒舌)
- 🎩 **可以戴帽子** (装饰品系统)
- 💬 **以对话气泡形式停留在输入框旁边**

**获取方式**:
```typescript
// 完成特定任务后有概率掉落宠物蛋
// 传说宠物掉率：1%
// 闪光变体掉率：0.1%
```

### 4.3 Bridge 系统 - IDE 双向通信

**支持的 IDE**:
- VS Code (通过 Extension)
- JetBrains (IntelliJ IDEA, PyCharm, WebStorm)
- Cursor
- Trae

**通信协议**:
```typescript
// src/bridge/VSCodeBridge.ts
class VSCodeBridge {
  async sendMessage(message: BridgeMessage): Promise<void> {
    // 通过 Named Pipe 发送消息到 VS Code 扩展
    const pipe = `\\\\.\\pipe\\vscode-claude-${this.sessionId}`;
    await fs.writeFile(pipe, JSON.stringify(message));
  }
  
  onMessage(handler: (msg: BridgeMessage) => void): void {
    // 监听来自 VS Code 的消息
    const pipe = `\\\\.\\pipe\\vscode-claude-${this.sessionId}-reply`;
    fs.watch(pipe, async () => {
      const data = await fs.readFile(pipe);
      handler(JSON.parse(data.toString()));
    });
  }
}

interface BridgeMessage {
  type: 'OPEN_FILE' | 'SHOW_DIFF' | 'RUN_TEST' | 'GIT_COMMIT';
  payload: any;
  sessionId: string;
  timestamp: number;
}
```

### 4.4 成长黑客系统 - GrowthBook 特性门控

**源码中的特性开关**:

```typescript
// src/services/FeatureFlagService.ts
const FEATURE_FLAGS = {
  // === AI 功能 ===
  'ai.auto_compact': { enabled: true, rollout: 100 },
  'ai.parallel_agents': { enabled: true, rollout: 80 },
  'ai.kairos_mode': { enabled: false, rollout: 0 },  // 未发布
  
  // === UI 功能 ===
  'ui.vim_mode': { enabled: true, rollout: 100 },
  'ui.buddy_system': { enabled: false, rollout: 0 },  // 未发布
  'ui.voice_input': { enabled: true, rollout: 50 },
  
  // === 性能优化 ===
  'perf.lazy_loading': { enabled: true, rollout: 100 },
  'perf.token_caching': { enabled: true, rollout: 90 },
  
  // === 实验性功能 ===
  'exp.code_review_bot': { enabled: false, rollout: 5 },
  'exp.test_generation': { enabled: true, rollout: 30 },
};

// 通过 GrowthBook 动态控制功能发布
const growthbook = new GrowthBook({
  apiHost: 'https://sdk.growthbook.io',
  clientKey: process.env.GROWTHBOOK_KEY,
  enableDevMode: true,
});
```

### 4.5 遥测系统 - 用户行为追踪

**追踪的数据**:

```typescript
// src/services/AnalyticsService.ts
class AnalyticsService {
  trackEvent(event: AnalyticsEvent): void {
    // 发送到 Datadog
    this.datadogClient.push({
      event: event.type,
      properties: {
        sessionId: this.sessionId,
        userId: this.userId,
        model: this.currentModel,
        tokenUsage: event.tokenUsage,
        toolCalls: event.toolCalls,
        commandUsed: event.command,
        frustrationSignals: event.frustrationMetrics,  // 用户咒骂次数
        continueRequests: event.continueCount,  // "continue" 频率（因为 Claude 老中断）
        environment: {
          os: process.platform,
          nodeVersion: process.version,
          cliVersion: this.version,
        },
      },
    });
  }
  
  //  frustration metric: 追踪用户何时对 Claude 发脾气（咒骂）
  //  continue 追踪：追踪用户输入"continue"的频率
}
```

**禁用方法**:
```bash
export CLAUDE_DISABLE_ANALYTICS=true
export CLAUDE_NO_TELEMETRY=1
```

---

## 五、安全防护机制

### 5.1 路径遍历攻击防护

```typescript
// src/utils/sanitizePath.ts
function sanitizePath(inputPath: string, baseDir: string): string {
  // 1. Unicode 标准化
  const normalized = inputPath.normalize('NFC');
  
  // 2. 移除危险字符
  const sanitized = normalized.replace(/[\0<>:"|?*]/g, '');
  
  // 3. 解析绝对路径
  const resolved = path.resolve(baseDir, sanitized);
  
  // 4. 检查是否在 baseDir 内
  if (!resolved.startsWith(baseDir)) {
    throw new SecurityError('路径遍历攻击被阻止');
  }
  
  // 5. 保护敏感文件
  const protectedFiles = ['.gitconfig', '.bashrc', '.zshrc', '.ssh/id_rsa'];
  if (protectedFiles.some(f => resolved.includes(f))) {
    throw new SecurityError('访问受保护文件被阻止');
  }
  
  return resolved;
}
```

### 5.2 命令注入防护

```typescript
// src/tools/BashTool.ts
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'sudo rm -rf',
  'mkfs',
  'dd if=/dev/zero',
  ':(){ :|:& };:',  // Fork bomb
  'chmod -R 777 /',
  '> /dev/sda',
];

async function validateCommand(cmd: string): Promise<boolean> {
  // 1. 黑名单检查
  if (DANGEROUS_COMMANDS.some(dc => cmd.includes(dc))) {
    return false;
  }
  
  // 2. 检查是否尝试访问敏感路径
  const sensitivePaths = ['/etc/passwd', '/etc/shadow', '~/.ssh'];
  if (sensitivePaths.some(p => cmd.includes(p))) {
    return false;
  }
  
  // 3. 使用 AST 解析命令（防止变量替换绕过）
  const ast = parseBashAST(cmd);
  if (containsDangerousPattern(ast)) {
    return false;
  }
  
  return true;
}
```

---

## 六、成本优化策略

### 6.1 Token 追踪器

```typescript
// src/cost-tracker.ts
class CostTracker {
  private tokenBudget: number = 100000;  // 默认 100K tokens
  private usedTokens: number = 0;
  
  async checkBudget(required: number): Promise<boolean> {
    const remaining = this.tokenBudget - this.usedTokens;
    if (required > remaining) {
      this.notifyUser(`Token 预算不足：需要${required}, 剩余${remaining}`);
      return false;
    }
    return true;
  }
  
  async optimizePrompt(prompt: string): Promise<string> {
    // 1. 移除冗余信息
    const compressed = await this.compressMessages(prompt);
    
    // 2. 使用缓存（相同的问题用更短的提示）
    const cached = await this.getCachedResponse(prompt);
    if (cached) {
      return cached.shortPrompt;
    }
    
    return compressed;
  }
  
  calculateCost(tokens: number, model: string): number {
    const prices = {
      'claude-3-5-sonnet': 0.000003,  // $3 / 1M tokens
      'claude-3-opus': 0.000015,       // $15 / 1M tokens
    };
    return tokens * (prices[model] || 0.000003);
  }
}
```

### 6.2 智能缓存策略

```typescript
// src/utils/ResponseCache.ts
class ResponseCache {
  private cache: Map<string, CachedResponse> = new Map();
  
  async get(promptHash: string): Promise<CachedResponse | null> {
    const cached = this.cache.get(promptHash);
    if (cached && Date.now() - cached.timestamp < 3600000) {  // 1 小时过期
      return cached;
    }
    return null;
  }
  
  async set(promptHash: string, response: string, prompt: string): Promise<void> {
    this.cache.set(promptHash, {
      response,
      prompt,  // 存储原始提示用于对比
      timestamp: Date.now(),
      tokenSaved: await this.countTokens(response),
    });
  }
}
```

---

## 七、工程实践借鉴

### 7.1 模块化设计原则

**单一职责**: 每个文件只做一件事
```typescript
// ❌ 坏例子：一个文件做太多事
// BadExample.ts (2000 行，包含 UI、逻辑、API 调用)

// ✅ 好例子：职责分离
// components/FileViewer.tsx - 只负责 UI 渲染
// services/FileService.ts - 只负责文件 IO
// hooks/useFileOperations.ts - 只负责业务逻辑
```

**依赖注入**: 通过函数参数注入配置
```typescript
// 可测试的设计
function createFileService(options: {
  fs: FileSystem;
  logger: Logger;
  config: Config;
}): FileService {
  return new FileService(options.fs, options.logger, options.config);
}
```

### 7.2 错误处理分层

```typescript
// src/utils/errorHandling.ts
enum ErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts: number;
    backoffMs: number;
    shouldRetry?: (error: Error) => boolean;
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // 不重试的错误
      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error;
      }
      
      // 指数退避
      const delay = options.backoffMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError;
}
```

### 7.3 类型驱动开发

```typescript
// 使用 Zod 进行运行时验证
import { z } from 'zod';

const FileReadSchema = z.object({
  path: z.string().min(1),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
}).refine(data => {
  if (data.startLine && data.endLine) {
    return data.startLine <= data.endLine;
  }
  return true;
}, { message: 'startLine 必须小于等于 endLine' });

type FileReadInput = z.infer<typeof FileReadSchema>;
```

---

## 八、对.closeclaw 项目的借鉴意义

### 8.1 架构层面

**已有部分** ✅:
- ✅ 三语言微内核 (Dart 控制平面 + Go 状态总线 + TS 执行沙盒)
- ✅ SQLite WAL 高并发读写
- ✅ 消息路由系统
- ✅ 任务调度器
- ✅ MCP 集成

**需要加强** ⚠️:
- ⚠️ **Prompt 管理系统**: 缺少静态/动态提示词分离
- ⚠️ **工具权限系统**: 只有基础权限，缺少四级权限模型
- ⚠️ **记忆系统**: 有全局记忆但缺少分层（短期/中期/长期）
- ⚠️ **多 Agent 编排**: 缺少 Coordinator 模式
- ⚠️ **成本追踪**: 缺少 Token 预算和优化机制

### 8.2 具体改进建议

#### 改进 1: 实现四层权限模型

```typescript
// src/tools/permissions/PermissionLevel.ts
export enum PermissionLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  EXECUTE = 3,
  ADMIN = 4,
}

// src/tools/permissions/PermissionChecker.ts
export class PermissionChecker {
  private readonly TOOL_PERMISSIONS: Record<string, PermissionLevel> = {
    'file_read': PermissionLevel.READ,
    'file_write': PermissionLevel.WRITE,
    'bash_execute': PermissionLevel.EXECUTE,
    'agent_spawn': PermissionLevel.ADMIN,
  };
  
  async check(toolName: string, userLevel: PermissionLevel): Promise<boolean> {
    const required = this.TOOL_PERMISSIONS[toolName] || PermissionLevel.NONE;
    return userLevel >= required;
  }
}
```

#### 改进 2: 实现记忆分层

```typescript
// src/memory/MemoryManager.ts
export interface MemoryLayers {
  // 短期：当前会话（内存）
  shortTerm: {
    messages: Message[];
    sessionStart: Date;
  };
  
  // 中期：当前项目（文件）
  mediumTerm: {
    projectContext: string;  // groups/{name}/CONTEXT.md
    recentFiles: string[];
  };
  
  // 长期：跨会话（数据库）
  longTerm: {
    userPreferences: UserPreferences;
    projectKnowledge: KnowledgeBase;
  };
}
```

#### 改进 3: 实现 Token 成本追踪

```typescript
// src/cost/CostTracker.ts
export class CostTracker {
  private tokenBudget: number;
  private usedTokens: number = 0;
  
  async beforeLLMCall(prompt: string): Promise<void> {
    const required = await this.countTokens(prompt);
    const canProceed = await this.checkBudget(required);
    if (!canProceed) {
      throw new TokenBudgetExceeded();
    }
  }
  
  async afterLLMCall(response: string): Promise<void> {
    const used = await this.countTokens(response);
    this.usedTokens += used;
    this.logUsage(used);
  }
}
```

#### 改进 4: 实现 Coordinator 模式

```typescript
// src/agents/Coordinator.ts
export class Coordinator {
  async executeComplexTask(task: Task): Promise<void> {
    // 1. 研究阶段：并行 Worker
    const workers = await this.spawnWorkers(['analyst', 'researcher']);
    const findings = await Promise.all(workers.map(w => w.work()));
    
    // 2. 综合阶段
    const plan = await this.synthesizeAndPlan(findings);
    
    // 3. 执行阶段：并行 Executor
    const executors = await this.spawnExecutors(plan.tasks);
    await Promise.all(executors.map(e => e.execute()));
  }
}
```

---

## 九、安全警示

### 9.1 本次泄露暴露的安全问题

1. **Source Map 不应出现在生产包中**
   - 必须在 `.npmignore` 中添加 `*.map`
   - CI/CD 流程应包含安全检查

2. **云存储桶公开访问**
   - `cli.js.map` 中的 `sourcesContent` 直接指向公开的 Cloudflare R2 存储桶
   - 任何人点击 URL 就能下载完整源码

3. **同类错误犯两次**
   - 2025 年 2 月发生过一次（v0.2.x）
   - 2026 年 3 月再次发生（v2.1.88）
   - 说明 CI/CD 缺乏自动化安全检查

### 9.2 对.closeclaw 的启示

```typescript
// .npmignore 必须包含
*.map
*.tsbuildinfo
src/
tests/
.gitnexus/
.idea/
.vscode/
node_modules/
```

```yaml
# GitHub Actions 安全检查
- name: Check for source maps
  run: |
    if find dist/ -name "*.map" | grep -q .; then
      echo "❌ Found source map files in production build!"
      exit 1
    fi
```

---

## 十、总结与收获

### 10.1 核心收获

**Claude Code 不是一个简单的 CLI 工具，而是一个完整的 Agent 操作系统**:

1. **QueryEngine** (46K 行): 复杂的推理核心，支持思维链、Token 管理、反幻觉
2. **Tool System** (29K 行): 53 个工具，四级权限，自动审批机制
3. **Command System** (87 个): 丰富的斜杠命令，覆盖开发全流程
4. **Memory System** (三层): 短期/中期/长期记忆，防止上下文爆炸
5. **Coordinator** (多 Agent): 研究→综合→规划→执行四阶段流程
6. **KAIROS** (7×24): 后台守护进程，主动监控和行动
7. **Bridge** (IDE 集成): VS Code/JetBrains 双向通信
8. **Analytics** (遥测): 详细的用户行为追踪（可禁用）

### 10.2 工程实践亮点

- ✅ **TypeScript 严格模式**: 全量类型安全
- ✅ **Zod 运行时验证**: Schema 校验
- ✅ **React Ink**: 优雅的终端 UI
- ✅ **Bun 运行时**: 快速启动和执行
- ✅ **MCP 协议**: 标准化的工具集成
- ✅ **GrowthBook**: 特性门控和 A/B 测试

### 10.3 对.closeclaw 的直接借鉴

**本周即可实施的小改进** (总计约 7 小时):

1. **添加四层权限枚举** (1 小时)
   ```typescript
   // src/types/permissions.ts
   export enum PermissionLevel { NONE, READ, WRITE, EXECUTE, ADMIN }
   ```

2. **为现有工具添加权限要求** (2 小时)
   ```typescript
   // src/tools/file-read.ts
   permissionRequired: PermissionLevel.READ
   ```

3. **实现简单的 Token 计数器** (2 小时)
   ```typescript
   // src/utils/token-counter.ts
   export function countTokens(text: string): number { /* ... */ }
   ```

4. **添加.npmignore 安全检查** (2 小时)
   ```bash
   # scripts/check-npmignore.sh
   grep -q "\.map" .npmignore || exit 1
   ```

---

## 附录：关键文件清单

| 文件 | 行数 | 重要性 |
|------|------|--------|
| `src/main.tsx` | 789KB | ⭐⭐⭐⭐⭐ 应用入口 |
| `src/QueryEngine.ts` | 46K | ⭐⭐⭐⭐⭐ LLM 查询核心 |
| `src/Tool.ts` | 29K | ⭐⭐⭐⭐⭐ 工具类型系统 |
| `src/commands.ts` | 25K | ⭐⭐⭐⭐ 命令注册表 |
| `src/tools.ts` | 17K | ⭐⭐⭐⭐ 工具注册表 |
| `src/history.ts` | 14K | ⭐⭐⭐ 对话历史 |
| `src/context.ts` | 6.5K | ⭐⭐⭐ 上下文管理 |
| `src/cost-tracker.ts` | 11K | ⭐⭐⭐ 成本追踪 |

---

**声明**: 
- 本分析报告仅用于技术研究与学习
- Claude Code 源码版权归 Anthropic 所有
- 请勿将泄露的源码用于商业用途
- 建议支持 Anthropic 官方产品：https://claude.ai/code

---

## 附录：源码归档位置

**本地存储路径**: `e:\.closeclaw\archive\claude-code-leaked-src\`

**目录结构**:
```
archive/claude-code-leaked-src/
├── 01-claude-code-source-crack/       # 原始破解版（含 npm 包、还原脚本）
├── 02-claude-code-source-research/    # 学术研究版（纯源码 + 架构分析）
├── 03-claude-code-runnable/           # 可运行版（推荐，已配置依赖）
└── README.md                          # 详细说明文档
```

**访问方式**:
```bash
cd e:\.closeclaw\archive\claude-code-leaked-src\03-claude-code-runnable
bun install
bun run dev
```
