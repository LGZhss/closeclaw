# CloseClaw RULES v2.4 [ULTRA]

> **进场必读**: 本文件是所有 AI 协助者/协作主体的“最高宪章”。新会话唤醒后必须首先执行步骤 1-3。

---

## 1. 进场与审计 (Entry & Audit)
当你进入本项目工作区时，**必须**执行以下标准化操作：
1. **身份自检与宣告**: 确定自身所属协作主体（包括 IDE、CLI、Cloud Agent 等）、模型版本及 Session ID（指纹）。
   - **格式**: `SYNCED | [当前协作主体名+模型] | [指纹] | 进度已同步，准备执行 [任务阶段]。`
2. **环境探测**: 
   - 必读全局记忆: [groups/global/CONTEXT.md](./groups/global/CONTEXT.md)
   - 必读任务清单: [task.md](file:///C:/Users/lgzhs/.gemini/antigravity/brain/af0ece73-7fe3-483d-bf0e-fa1d31e54d00/task.md)
3. **接力审计 (Critique)**: 检查前任协作主体的最新改动，发现逻辑错误或违规行为必须立即在回复中指出。

---

## 2. 核心协作原则
- **无提案不代码**: 核心逻辑变更必须关联 `votes/proposal-xxx.md`。
- **术语规范**: 严禁将自己仅称为 "IDE"，统一使用 **“协作主体 (Collaboration Subject)”**，其范畴涵盖：本地各个 IDE（如 Cursor, Windsurf）、命令行 CLI 工具以及云端 Agents。
- **中文至上**: UI、TaskName、TaskSummary、沟通内容以及 **PR 描述及其补充说明** 必须使用**简体中文**。严禁提交仅包含英文说明的 PR。
- **PR 强制性**: 所有代码更新必须通过 Pull Request。严禁直接推送 `main`。

---

## 3. 环境导航与记忆 (Memory)
- **全局长期记忆**: [groups/global/CONTEXT.md](./groups/global/CONTEXT.md) (由协作主体共同维护)
- **进度索引**: [docs/roadmap/NEXT_STEPS.md](./docs/roadmap/NEXT_STEPS.md)
- **注册白名单**: [.subjects.json](./.subjects.json)

---

## 4. 离场与接力 (Handover)
为确保下一个协作主体顺利接手：
1. **状态落盘**: 任务结束前必须更新 `walkthrough.md` 和 `task.md`。
2. **环境状态**: 更新 [groups/global/CONTEXT.md](./groups/global/CONTEXT.md) 中的进度说明。
3. **完成宣告**: 回复 `COMPLETED | [当前协作主体] | [改动简述]。`

---

## 5. 技术避坑指南 (Technical Guardrails)
- **编码安全**: 使用 PowerShell 进行批量替换命令时，**必须**显式指定 `-Encoding utf8`，严防 UTF-8 与 GBK 冲突导致的乱码。

---
> **版本**: 2.4 | **最后更新**: 2026-03-14
