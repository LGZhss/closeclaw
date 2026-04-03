# CloseClaw 项目文件夹布局分析报告

> **分析时间**: 2026 年 4 月 1 日  
> **项目版本**: P031 Governance Reconstruction  
> **架构模式**: 三语言微内核（Dart + Go + TypeScript）

---

## 📊 整体布局概览

### 根目录结构 (e:\.closeclaw\)

```
.closeclaw/
├── 🔧 核心源码层
│   ├── cmd/          (6 items)    # Dart 控制平面
│   ├── kernel/       (9 items)    # Go 状态总线
│   └── src/          (10 items)   # TS 执行沙盒
│
├── 📦 构建产物层
│   ├── bin/          (2 items)    # 编译后的可执行文件
│   ├── dist/         (49 items)   # TS 编译输出
│   └── data/         (7 items)    # 运行时数据
│
├── 📚 文档体系层
│   ├── docs/         (11 dirs)    # 结构化文档
│   ├── votes/        (9 items)    # 提案决议区
│   └── archive/      (3 items)    # 历史归档
│
├── ⚙️ 配置文件层
│   ├── .env, .env.example
│   ├── package.json, tsconfig.json
│   ├── pubspec.yaml (Dart)
│   └── go.mod, go.sum (Go)
│
├── 🏷️ IDE 协作层 (13 个 IDE 配置目录)
│   ├── .claude/, .lingma/, .qoder/, .kiro/
│   ├── .gemini/, .comate/, .joycode/
│   ├── .gitnexus/, .workbuddy/, .arts/
│   ├── .codeartsdoer/, .dropstone/
│   └── .idea/ (JetBrains)
│
├── 🛡️ 质量保障层
│   ├── tests/        (6 items)    # 测试套件
│   ├── coverage/     (10 items)   # 覆盖率报告
│   ├── .github/      (10 workflows)
│   └── 多个安全扫描配置
│
└── 📝 根级文档
    ├── README.md, AGENTS.md, CLAUDE.md
    ├── RULES.md, SECURITY.md
    ├── LICENSE, current_problems.md
    └── .subjects.json (IDE 注册表)
```

---

## 🗂️ 分层详细分析

### 第一层：核心源码层（三语言微内核）

#### 1️⃣ `cmd/` - Dart 控制平面 (6 items)

```
cmd/
├── closeclaw.exe        # 主程序（6.3 MB，已编译）
├── bin/
│   └── closeclaw.dart   # 主入口
├── lib/                 # 守护进程与审计中继
├── pubspec.yaml         # Dart 依赖配置
└── pubspec.lock         # 依赖锁定
```

**职责**: 
- ✅ 生命周期管理
- ✅ MCP Server 对外暴露
- ✅ CLI 交互界面
- ✅ 用户命令解析

**技术栈**: Dart (编译为原生 exe，零环境依赖启动)

---

#### 2️⃣ `kernel/` - Go 状态总线 (9 items)

```
kernel/
├── main.go              # Go 入口
├── go.mod, go.sum       # Go 依赖管理
├── db/                  # SQLite WAL 高并发总线 (3 files)
├── router/              # 消息分发核心 (2 files)
├── scheduler/           # 毫秒级任务循环 (2 files)
├── server/              # HTTP/gRPC服务器 (3 files)
├── llm/                 # LLM 适配器 (1 file)
└── proto/               # Protobuf 定义 (2 files)
```

**职责**:
- ✅ 高性能 SQLite WAL 并发读写
- ✅ SSE 网络流处理
- ✅ 分布式 TraceID 生成
- ✅ 消息路由与分发
- ✅ 定时任务调度

**技术栈**: Go (Gin + gRPC + SQLite WAL)

**关键特性**:
- 通过 Named Pipe 与 TS 握手
- 支持高并发读写（WAL 模式）
- 微服务架构设计

---

#### 3️⃣ `src/` - TypeScript 执行沙盒 (10 items)

```
src/
├── index.ts             # NPM 执行入口
├── config.ts            # 配置加载
├── logger.ts            # 日志系统
├── types.ts             # 类型定义
├── adapters/            # LLM 适配器 (2 files)
├── agent/               # Agent 核心逻辑 (2 files)
├── sandbox/             # 生态执行隔板 (2 files)
├── tools/               # 动态工具挂载 (2 files)
├── utils/               # 工具函数 (2 files)
└── bus/                 # 事件总线 (1 file) ← 新增
```

**职责**:
- ✅ 具体 SDK 调用
- ✅ Telegram 复杂媒体处理
- ✅ Agent 工具执行
- ✅ LLM 请求处理

**技术栈**: TypeScript (ES2022 + strict mode)

**角色定位**: "哑终端" - 仅执行内核下发的指令

---

### 第二层：构建产物层

#### 4️⃣ `bin/` - 编译产物 (2 items)

```
bin/
├── closeclaw.exe        # 主程序（Dart 编译）
└── kernel.exe           # 内核（Go 编译，31 MB）
```

**特点**:
- ✅ 原生可执行文件
- ✅ 无需运行时环境
- ✅ 跨平台分发（Windows/Linux/macOS）

---

#### 5️⃣ `dist/` - TypeScript 编译输出 (49 items)

```
dist/
├── index.js, index.d.ts
├── config.js, config.d.ts
├── logger.js, logger.d.ts
├── router.js, router.d.ts
├── task-scheduler.js
├── group-queue.js
├── ipc.js
├── db.js
├── container-runner.js
├── types.js
├── adapters/
├── agent/
├── channels/
├── core/
├── sandbox/
├── tools/
├── utils/
└── *.js.map              # Source Maps（⚠️ 安全隐患）
```

**⚠️ 安全问题**:
- 包含 `.js.map` 文件
- 如果发布到 npm，会泄露源码
- **建议**: 生产环境应排除 source maps

---

#### 6️⃣ `data/` - 运行时数据 (7 items)

```
data/
├── messages.db           # SQLite 消息数据库
├── messages.db-shm
├── messages.db-wal
├── logs/                 # 日志文件
├── sessions/             # 会话状态
└── groups/
    └── main/             # 群组记忆 (CONTEXT.md)
└── ipc/                  # 进程间通信数据
```

**特点**:
- ✅ WAL 模式启用（高并发）
- ✅ 分群组记忆存储
- ✅ 会话隔离

---

### 第三层：文档体系层

#### 7️⃣ `docs/` - 结构化文档 (11 个子目录)

```
docs/
├── 01-getting-started/   # 入门指南
├── 02-collaboration/     # 协作流程
├── 03-development/       # 开发指南
├── 04-reference/         # API 参考
├── 05-architecture/      # 架构设计
├── 06-registry/          # 注册表说明
├── 07-roadmap/           # 未来规划
├── archive/              # 历史文档 (12 items)
├── reference/            # 外部参考 (2 items)
│   ├── ai-应用架构借鉴分析.md
│   └── Claude-Code-源码深度解析.md
└── reports/              # 审计报告
```

**✅ 优点**:
- 数字前缀强制排序（符合项目规范）
- 分类清晰（入门→协作→开发→参考→架构→规划）
- 有专门的归档区

**📊 文档统计**:
- 7 个主要分类目录
- 2 个参考文档（Claude Code 分析）
- 12 个历史归档文档
- 1 个审计报告

---

#### 8️⃣ `votes/` - 提案决议区 (9 items)

```
votes/
├── proposal-template.md              # 提案模板
├── proposal-001-sandbox-fs-promises.md
├── proposal-029-governance-hardening-and-kernel-opt.md
├── proposal-030-security-audit-hardening.md
├── proposal-031-governance-build-reconstruction.md
├── proposal-100-process-executor-async-fs.md
├── .P031_INTEGRATION_LOG.md
├── archive/              # 已通过提案归档 (30 items)
└── .gitkeep
```

**治理流程**:
1. 复制提案模板
2. 创建工作树开发
3. 提交 PR 等待投票
4. 通过后合并并归档

**投票规则**:
- Level 1: ≥2 IDE  votes（文档/小修复）
- Level 2: ≥5 IDE votes（功能/优化）
- Level 3: ≥8 IDE votes（架构/重大变更）

---

#### 9️⃣ `archive/` - 项目归档区 (3 items)

```
archive/
├── audit_report_2026_03_24.md
├── claude-code-leaked-src/     # Claude Code 泄露源码 (新增)
│   ├── 01-claude-code-source-crack/
│   ├── 02-claude-code-source-research/
│   ├── 03-claude-code-runnable/
│   └── ARCHIVE_README.md
└── tests/                      # 历史测试归档 (18 items)
```

**✅ 优点**:
- 保持根目录整洁
- 有专门的归档说明文档
- 分类清晰（审计报告/源码研究/测试历史）

---

### 第四层：配置文件层

#### 📋 核心配置文件

```
.closeclaw/
├── .env                        # 环境变量（本地）
├── .env.example                # 环境变量模板
├── package.json                # Node.js 依赖
├── tsconfig.json               # TypeScript 配置
├── vitest.config.ts            # 测试框架配置
├── eslint.config.mjs           # 代码检查配置
├── pubspec.yaml                # Dart 依赖
├── go.mod, go.sum              # Go 依赖
├── sonar-project.properties    # SonarQube 配置
├── qodana.yaml                 # Qodana 静态分析
└── renovate.json               # 依赖自动更新
```

**环境配置** (`.env`):
```bash
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=...
ZHIPU_API_KEY=...

# Telegram
TELEGRAM_TOKEN=...
TELEGRAM_ALLOWED_USER_IDS=...

# System
ASSISTANT_NAME=Andy
WORKSPACE_DIR=E:\.closeclaw\data
DEFAULT_PROVIDER=anthropic
```

---

### 第五层：IDE 协作层（13 个 IDE 配置）

#### 🤖 注册 IDE 列表 (`.subjects.json`)

```json
{
  "registered_ides": [
    "Cursor", "Antigravity", "PearAI", "Trae",
    "CodeBuddy", "JoyCode", "Kiro", "Qoder",
    "Lingma", "Comate", "Gemini", "Worky",
    "Dropstone", "MarsCode", "CodeArtsDoer"
  ]
}
```

#### 📁 IDE 专属目录

```
.closeclaw/
├── .claude/              # Claude Code 配置
├── .lingma/              # 通义灵码配置
├── .qoder/               # Qoder 配置
├── .kiro/                # Kiro 配置
├── .gemini/              # Google Gemini 配置
├── .comate/              # 百度 Comate 配置
├── .joycode/             # 华为 JoyCode 配置
├── .workbuddy/           # Worky Buddy 配置
├── .dropstone/           # Dropstone 配置
├── .codeartsdoer/        # CodeArts Doer 配置
├── .arts/                # Arts 配置
├── .gitnexus/            # GitNexus 代码智能索引
└── .idea/                # JetBrains IDE 配置
```

**每个 IDE 目录包含**:
- `skills/` - 专属技能库
- `agents/` - 自定义 Agent
- `memory/` - 本地记忆
- `config.json` - IDE 特定配置

**✅ 设计理念**:
- 多 IDE 并行协作
- 每个 IDE 独立配置
- 支持 27+ 注册协作主体

---

### 第六层：质量保障层

#### 🔒 `tests/` - 测试套件 (6 items)

```
tests/
├── config.test.ts
├── process-executor.test.ts
├── root-directory-cleanup.test.ts
├── integration/           # 集成测试
└── utils/                 # 测试工具 (3 files)
```

**测试框架**: Vitest 4.1.0  
**测试位置**: `tests/**/*.test.ts`

---

#### 📊 `coverage/` - 覆盖率报告 (10 items)

```
coverage/
├── index.html             # HTML 报告入口
├── config.ts.html
├── coverage-final.json    # JSON 格式数据
├── prettify.js
├── block-navigation.js
└── *.css, *.png
```

**覆盖率提供者**: v8  
**报告类型**: text, json, html

---

#### 🛡️ `.github/workflows/` - CI/CD (10 workflows)

```yaml
codacy-analysis.yml        # Codacy 代码质量
code_quality.yml           # 代码质量检查
dependency-review.yml      # 依赖安全审查
mirror.yml                 # 镜像同步
ossf-scorecard.yml         # OpenSSF 安全评分
semgrep.yml                # Semgrep 安全扫描
sigstore-cosign.yml        # Sigstore 签名
snyk.yml                   # Snyk 安全扫描
sonarcloud.yml             # SonarCloud 代码质量
stale.yml                  # 自动关闭 stale issue
```

**安全扫描工具**:
- ✅ Snyk（依赖漏洞扫描）
- ✅ Semgrep（静态代码分析）
- ✅ SonarCloud（代码质量）
- ✅ Codacy（自动化代码审查）
- ✅ OpenSSF Scorecard（供应链安全）

---

#### 🏷️ 其他质量配置

```
.closeclaw/
├── .deepsource.toml       # DeepSource 配置
├── .snyk                  # Snyk 配置
├── qodana.yaml            # JetBrains Qodana
├── sonar-project.properties # SonarQube 配置
└── renovate.json          # 依赖自动更新
```

---

### 第七层：根级文档

#### 📝 核心文档

```
.closeclaw/
├── README.md               # 项目简介 (2.8 KB)
├── AGENTS.md               # AI Agent 指南 (14.2 KB)
├── CLAUDE.md               # Claude 使用指南 (5.5 KB)
├── RULES.md                # 项目规则 (2.2 KB)
├── SECURITY.md             # 安全政策 (0.1 KB)
├── LICENSE                 # 开源协议 (11.1 KB)
├── current_problems.md     # 当前问题清单 (1.9 KB)
└── .subjects.json          # IDE 注册表 (0.7 KB)
```

**文档分工**:
- **README.md**: 快速入门、项目概述
- **AGENTS.md**: AI Agent 协作指南（GitNexus 使用说明）
- **CLAUDE.md**: Claude Code 特定配置
- **RULES.md**: 编码规范、提交流程
- **SECURITY.md**: 安全报告流程
- **current_problems.md**: 待解决问题追踪

---

## 🎯 架构特点分析

### ✅ 优点

1. **清晰的三层架构**
   - Dart（控制平面）+ Go（状态总线）+ TS（执行沙盒）
   - 职责分离明确
   - 跨语言协作通过 Named Pipe + Protobuf

2. **完善的文档体系**
   - 7 个分类目录（数字前缀排序）
   - 专门的归档区
   - 外部参考文档（Claude Code 分析）

3. **强大的质量保障**
   - 10 个 CI/CD workflows
   - 5 个安全扫描工具
   - 完整的测试套件

4. **灵活的 IDE 协作**
   - 13 个 IDE 专用目录
   - 27+ 注册协作主体
   - 独立配置互不干扰

5. **规范的治理流程**
   - 提案制度（votes/）
   - 投票规则（三级决策）
   - 归档机制

---

### ⚠️ 潜在问题

1. **Source Map 安全隐患**
   - `dist/*.js.map` 包含完整源码
   - 如果发布到 npm 会泄露
   - **建议**: `.npmignore` 中添加 `*.map`

2. **根目录略显杂乱**
   - 31 MB 的 `closeclaw-kernel.exe` 在根目录
   - `logs-1774949223965.zip` 临时文件
   - `current_problems.md` 可直接移入 `docs/`

3. **配置文件分散**
   - ESLint 配置有两个：`.eslintrc.json` + `eslint.config.mjs`
   - 可能需要统一

4. **归档目录层级不一致**
   - `docs/archive/` (12 items)
   - `votes/archive/` (30 items)
   - `archive/` (3 items)
   - **建议**: 统一归档策略

---

## 📋 优化建议

### 短期优化（本周可完成）

1. **清理根目录临时文件**
   ```bash
   # 移动或刪除
   mv logs-*.zip archive/
   mv current_problems.md docs/07-roadmap/current-problems.md
   ```

2. **统一 ESLint 配置**
   ```bash
   # 保留 eslint.config.mjs（新标准），删除.eslintrc.json
   rm .eslintrc.json
   ```

3. **添加.npmignore 安全检查**
   ```bash
   # 在 scripts/ 中添加 check-npmignore.sh
   echo "*.map" >> .npmignore
   ```

4. **规范化归档目录**
   ```
   archive/
   ├── 01-audit-reports/
   ├── 02-source-code-studies/
   └── 03-test-history/
   ```

---

### 中期优化（下个月）

1. **移动大文件到专用目录**
   ```
   binaries/
   ├── closeclaw.exe
   └── kernel.exe
   ```

2. **创建统一的文档索引**
   ```markdown
   docs/INDEX.md
   - 链接到所有子目录
   - 快速导航
   - 搜索指引
   ```

3. **实现自动化归档**
   ```yaml
   # GitHub Actions
   - name: Archive old proposals
     run: |
       find votes/ -name "proposal-*.md" -mtime +90 -exec mv {} archive/ \;
   ```

---

## 📊 统计数据汇总

| 类别 | 数量 | 总大小 |
|------|------|--------|
| **源码目录** | 3 (cmd/kernel/src) | ~500 KB |
| **编译产物** | 2 (bin/dist) | ~50 MB |
| **文档目录** | 11 (docs 子目录) | ~2 MB |
| **IDE 配置** | 13 个目录 | ~100 KB |
| **CI/CD** | 10 workflows | ~50 KB |
| **配置文件** | 12 个 | ~20 KB |
| **测试相关** | 2 (tests/coverage) | ~500 KB |
| **数据文件** | 1 (data/) | ~10 MB (SQLite) |
| **根级文档** | 8 个文件 | ~40 KB |
| **归档内容** | 3 个大项 | ~100 MB |

**总计**: ~210 MB（含编译产物和数据）

---

## 🎓 设计哲学总结

CloseClaw 的文件夹布局体现了以下设计哲学：

1. **关注点分离**: 源码/产物/文档/配置严格分层
2. **多语言协作**: Dart/Go/TS 各自独立又相互配合
3. **开放协作**: 13+ IDE 配置，支持 27+ 协作主体
4. **规范治理**: 提案制度 + 投票规则 + 归档机制
5. **质量优先**: 10 个 CI workflows + 5 个安全扫描
6. **文档驱动**: 7 类文档 + 数字前缀排序 + 专门归档

---

**报告生成时间**: 2026-04-01  
**下次审查日期**: 2026-05-01（月度架构审查）
