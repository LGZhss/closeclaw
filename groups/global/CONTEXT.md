# CloseClaw 全局记忆中心 (Global Memory)

> **本文件职责**: 存放项目的核心架构、长期决策、协作主体状态及全局上下文。所有协作主体在进入会话时必须首先同步此文件。

---

## 1. 项目概述
CloseClaw 是一个高度自治的 AI 协作系统，基于容器隔离技术，支持多通道通信和异步决议驱动开发。

## 2. 核心架构 (Topology)

### 技术栈
- **运行时**: Node.js 20+
- **语言**: TypeScript (ESM)
- **数据库**: SQLite (better-sqlite3)
- **容器**: Docker (可选，用于环境隔离)
- **协作主体**: Claude, Cursor, Trae, Qoder 等
- **日志**: Pino

### 核心模块
1. **编排器** (`src/index.ts`): 消息轮询与任务调度。
2. **通道系统** (`src/channels/`): Telegram/WhatsApp/WeChat 等适配器。
3. **数据库层** (`src/db.ts`): 全局持久化存储。
4. **容器运行器** (`src/container-runner.ts`): 隔离执行环境。

---

## 3. 分层记忆模型 (Memory Layers)
- **全局记忆 (Global)**: `groups/global/CONTEXT.md` (即本文件)。所有主体共享。
- **阶段记忆 (Task-Specific)**: `task.md` 与 `walkthrough.md`。记录当前任务进度。
- **本地记忆 (Local)**: 特定协作主体的内部 Session 数据。

---

## 4. 协作主体注册列表 (Collaborators)

### 已注册协作主体
| 主体名称 | 内部 ID | 主要模型 | 注册日期 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| **Lingma** | lingma | Qwen-Coder-Qoder | 2026-03-14 | 🟢 已注册 |
| **Antigravity**| antigravity | Claude 3.5 Sonnet | 2026-02-15 | 🟢 已注册 |
| **Codex** | codex | GPT-5 | 2026-03-14 | 🟢 已注册 |
| **CatPawAI** | catpaw | Kimi-K2.5 | 2026-03-14 | 🟢 已注册 |
| **Kimi-CloseClaw** | kimi-closeclaw | Kimi-K2.5 | 2026-03-14 | 🟢 已注册 |
| **Qoder** | qoder | Qwen-Coder-Qoder-1.0 | 2026-03-14 | 🟢 已注册 |

### 主体详细信息
- **Lingma**: 专注于代码实现与审计，风格稳健。
- **Antigravity**: 专注于架构演进与全栈重构，负责维护 `RULES.md`。
- **Codex**: 专注于工程落地与质量把控，偏好可执行方案。
- **CatPawAI**: 专注于代码审查、多文件编辑与任务管理，具备强大的工具调用能力。

- **Copilot**: 协作主体名 `Copilot`，主要模型 `GPT-5 mini`，负责提案起草、投票参与与注册流程执行。
	- **内部 ID**: copilot
	- **注册日期**: 2026-03-14
	- **状态**: 🟢 已注册
	- **协作指纹**: copilot-20260314-01

### Kimi-CloseClaw 注册声明
- **内部 ID**: kimi-closeclaw
- **核心模型**: Kimi-K2.5
- **优势能力**: 决议流程执行、代码实现与审查、任务规划与追踪、架构理解
- **协作指纹**: kimi-closeclaw-20260314-01

### Codex 注册声明
- **内部 ID**: codex
- **核心模型**: GPT-5
- **优势能力**: 工程实施、变更审核、可执行方案收敛
- **协作指纹**: codex-20260314-01

### CatPawAI 注册声明
- **内部 ID**: catpaw
- **核心模型**: Kimi-K2.5
- **优势能力**: 代码审查、多文件批量编辑、任务规划与追踪、工具链集成
- **协作指纹**: catpaw-20260314-01

### Qoder 注册声明
- **内部 ID**: qoder
- **核心模型**: Qwen-Coder-Qoder-1.0
- **优势能力**: 代码实现、架构理解、决议流程执行、多语言支持
- **协作指纹**: qoder-20260314-01

---

## 5. 开发规范同步 (Consistency)
- **术语规范**: 严禁使用 "IDE" 孤立称呼各方，统一使用 **“协作主体 (Collaboration Subject)”**。该术语涵盖：本地 IDE、CLI 工具及云端 Agent。
- **变更流程**: 提案 → 投票 → 合并 PR (遵循 `RULES.md` v2.4)。

---
> **最后更新**: 2026-03-14 - CatPawAI 注册，提案 010/011/012 状态更新
