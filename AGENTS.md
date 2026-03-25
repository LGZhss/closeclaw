<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **.closeclaw** (566 symbols, 1204 relationships, 23 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/.closeclaw/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/.closeclaw/context` | Codebase overview, check index freshness |
| `gitnexus://repo/.closeclaw/clusters` | All functional areas |
| `gitnexus://repo/.closeclaw/processes` | All execution flows |
| `gitnexus://repo/.closeclaw/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# Development Guide

## Common Commands

### Setup & Installation
```bash
npm install                  # Install dependencies
npm run setup               # Initialize development environment
npm run check-env           # Verify environment configuration
```

### Development Workflow
```bash
npm run dev                 # Development mode with hot reload (via tsx)
npm run build               # Compile TypeScript to dist/
npm start                   # Run compiled dist/index.js (production mode)
npm run typecheck           # Type check without emitting (tsc --noEmit)
```

### Code Quality
```bash
npm run format              # Format code with Prettier
npm run format:fix          # Format and fix issues
npm run format:check        # Check formatting without fixing
```

### Testing
```bash
npm test                    # Run tests once
npm run test:watch         # Watch mode for tests
npm run test:coverage      # Generate coverage report (v8 provider)
```

**Testing Framework**: Vitest 4.1.0 (modern, fast, Vue/Vite-native)  
**Test Location**: `tests/**/*.test.ts`  
**Coverage Output**: text, json, html reports available

## Project Structure

```
cmd/                         # 控制平面 (Dart)
├── bin/closeclaw.dart       # 主入口
└── lib/                     # 守护进程与审计中继

kernel/                      # 状态总线 (Go)
├── db/                      # SQLite WAL 高并发总线
├── scheduler/               # 毫秒级任务循环
└── router/                  # 消息分发核心

src/                         # 沙盒执行层 (TypeScript)
├── index.ts                 # NPM 执行入口
├── sandbox/                 # 生态执行隔板
└── tools/                   # Agent 动态挂载工具

proto/                       # 跨语言协议 (.proto)
docs/                        # 极简文档体系
groups/                      # 分群组记忆 (CONTEXT.md)
votes/                       # 协作提案决议区
```

## High-Level Architecture (P027)

### 三语言微内核栈 (Three-Language Micro-kernel)

**Layer 1: 控制平面 (Dart)**
- `cmd/` — 负责生命周期管理、MCP Server 对外暴露、CLI 交互。
- 编译为原生 `closeclaw.exe`，实现零环境依赖启动。

**Layer 2: 状态与网络总线 (Go)**
- `kernel/` — 负责高性能 SQLite WAL 并发读写、SSE 网络流处理、分布式 TraceID 生成。
- 作为系统的“神经中枢”，通过 Named Pipe 与 TS 握手。

**Layer 3: 生态执行沙盒 (TypeScript)**
- `src/` — 负责具体 SDK 调用、Telegram 复杂媒体处理。
- 角色调整为“哑终端”，仅执行内核下发的指令。

### Message Flow
```
Channel (Telegram)
  ↓
handleIncomingMessage()
  ↓
insertMessage() [SQLite]
  ↓
Message Loop (every 2s)
  ↓
Fetch unprocessed messages
  ↓
Group by chat_jid
  ↓
processGroup() via groupQueue
  ↓
processGroupMessages() [router]
  ↓
buildAgentPrompt()
  ↓
SandboxRunner.execute()
  ↓
LLMAdapter.chat()
  ↓
channel.sendMessage()
  ↓
markMessagesProcessed()
```

### Core Concepts

**Per-Group Memory**
- Each group has `groups/{groupName}/CONTEXT.md`
- Contains conversation history, group-specific instructions, shared context
- All messages in a group use this context

**Task Scheduling Patterns**
- **cron**: Standard cron expressions (e.g., `"0 9 * * MON"`)
- **interval**: Fixed milliseconds (e.g., `"60000"`)
- **once**: One-time execution

**Channel Callback Handlers**
- `onMessage(jid, message)` — Process incoming message
- `onChatMetadata(jid, metadata)` — Handle group info updates
- `registeredGroups()` — List active chats

## Configuration

### Environment Variables (.env)

**LLM Providers** (choose at least one):
- `ANTHROPIC_API_KEY` — Claude
- `OPENROUTER_API_KEY` — 350+ models
- `ZHIPU_API_KEY` — Recommended for Chinese, free tier available
- `OPENAI_API_KEY` — OpenAI models
- Plus: GitHub Models, SiliconFlow, Cerebras, Google Gemini, ModelScope, Mistral, Groq, Cohere, Hyperbolic, Databricks, etc.

**Telegram**:
- `TELEGRAM_TOKEN` — Bot token from @BotFather
- `TELEGRAM_ALLOWED_USER_IDS` — Comma-separated user IDs

**System**:
- `ASSISTANT_NAME` — Bot name (default: "Andy")
- `WORKSPACE_DIR` — Data directory (e.g., `E:\.closeclaw\data`)
- `DEFAULT_PROVIDER` — Primary LLM provider

**Verification**:
```bash
npm run check-env              # Verify configuration
node scripts/test-llm-apis.js  # Test LLM provider connectivity
```

## Governance & Collaboration

### Core Principles (see RULES.md)

- **No Proposal, No Code**: All changes require `votes/proposal-XXX.md`
- **Status Lock**: Only `✅ 已通过` (approved) proposals merge to main
- **Attribution Required**: `Proposal-By` and `Implemented-By` fields (see `.subjects.json`)
- **Chinese First**: UI, tasks, communication in Simplified Chinese

### Voting System

**Weights**:
- IDE collaborator: +1 / -2 (reverse weight for opposition)
- User: ±0.5n (where n = total IDE count)

**Decision Tiers**:
- **Level 1**: ≥2 IDE votes (documentation, minor fixes)
- **Level 2**: ≥5 IDE votes (features, optimization)
- **Level 3**: ≥8 IDE votes (architecture, major changes)

**Critical Thinking Requirement**: All votes must include:
- ✅ Technical reasoning (why support/oppose?)
- ✅ Risk assessment (identify potential issues)
- ✅ Improvement suggestions (if problems found)
- ✅ Alternative approaches (if applicable)

### Collaborator Registration

27 registered collaborator IDEs (see `.subjects.json`):
- Cursor, Antigravity, PearAI, Trae, CodeBuddy, JoyCode, Kiro, Qoder, etc.
- Each IDE has `.{name}/` directory for IDE-specific data

### Workflow

1. Copy proposal template: `cp templates/proposal-template.md votes/proposal-001.md`
2. Create worktree: `git worktree add ../worktrees/proposal-001 -b proposal/001`
3. Develop in worktree
4. Submit PR with complete proposal details
5. Wait for voting (all 27 registered IDEs + users can vote)
6. Once approved, merge to main

**Worktree Location**: `~/dev/closeclaw-proposals/`

## Database Schema

**SQLite Tables**:

| Table | Purpose |
|-------|---------|
| `messages(id, channel, jid, from, type, content, created_at, processed)` | Incoming messages |
| `registered_groups(jid, name, description, created_at)` | Chat metadata |
| `scheduled_tasks(id, group_jid, trigger_type, trigger_value, task_config, created_at)` | Task definitions |
| `task_run_logs(id, task_id, status, output, started_at, ended_at)` | Execution history |
| `sessions(group_jid, context, created_at, updated_at)` | Active session state |
| `router_state(group_jid, last_processed_id, updated_at)` | Polling state |

**Connection**: WAL mode enabled for concurrent readers/writers

## Performance Notes

- **Message Poll Interval**: 2000ms (configurable via `POLL_INTERVAL`)
- **Task Scheduler Poll**: 60000ms (via `SCHEDULER_POLL_INTERVAL`)
- **Per-Group Queuing**: Prevents cross-group message contention
- **Cached Intl.DateTimeFormat**: Optimizes date formatting in hot loops

## TypeScript Configuration

- **Target**: ES2022
- **Module**: NodeNext with node resolution
- **Strict Mode**: All strict checks enabled
  - `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
  - `strictNullChecks`, `strictFunctionTypes`, etc.
- **Declaration Files**: Generated for public API
- **Source Maps**: Enabled for debugging

## Dependencies

**Core**:
- `better-sqlite3` (11.8.1) — Synchronous SQLite bindings
- `openai` (6.32.0) — LLM API client
- `cron-parser` (5.5.0) — Cron expression parsing
- `pino` (9.6.0) — Structured logging
- `yaml` (2.8.2) — YAML parsing
- `zod` (4.3.6) — Schema validation

**Dev**:
- TypeScript 5.7.0
- tsx 4.19.0 (TypeScript executor)
- Vitest 4.1.0 (testing)
- Prettier 3.8.1 (formatting)
- Husky 9.1.7 (git hooks)

## GitNexus Integration

This project uses GitNexus for code intelligence:
- **2164 symbols** tracked, **4202 relationships** mapped, **143 execution flows** documented
- Index location: `.gitnexus/`
- After committing: `npx gitnexus analyze` to refresh
- Include `--embeddings` flag if previously enabled

See GitNexus section above for detailed tool usage.

## Key Files

- `src/index.ts` — Core orchestrator, main entry point
- `src/db.ts` — Database initialization and queries
- `src/router.ts` — Message routing, prompt building
- `src/config.ts` — Configuration loading
- `.env` — Environment variables (template: `.env.example`)
- `package.json` — Dependencies and npm scripts
- `tsconfig.json` — TypeScript strict configuration
- `vitest.config.ts` — Test framework configuration
- `.subjects.json` — Collaborator IDE registry
