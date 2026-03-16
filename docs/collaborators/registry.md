# CloseClaw 协作主体注册表

> **文件职责**: 静态参考文档，记录所有协作主体的 IDE 身份与可用模型列表。
> 运行时状态（提案进度、当前任务）请查阅 [`groups/global/CONTEXT.md`](../../groups/global/CONTEXT.md)。
>
> **维护规范**: 新增主体时在此文件追加条目，无需修改 CONTEXT.md。

---

## 注册总览

| 主体名称 | 内部 ID | 可用模型（完整列表） | 注册日期 |
| :--- | :--- | :--- | :--- |
| **Lingma** | lingma | qwen3-coder, qwen3-thinking, qwen3-max | 2026-03-14 |
| **Antigravity** | antigravity | Gemini 3.1 Pro (High), Gemini 3.1 Pro (Low), Gemini 3 Flash, Claude Sonnet 4.6 (Thinking), Claude Opus 4.6 (Thinking), GPT-OSS 120B (Medium) | 2026-02-15 |
| **Codex** | codex | GPT-5.2-Codex, GPT-5.2, GPT-5.1-Codex-Max, GPT-5.1-Codex-Mini | 2026-03-14 |
| **CatPawAI** | catpaw | longcat-flash, glm-5, glm-4.7, glm-4.6, kimi-k2.5, MiniMax-M2.5, MiniMax-M2.1, deepseek-v3.2 | 2026-03-14 |
| **Kimi-CloseClaw** | kimi-closeclaw | Kimi-K2.5 | 2026-03-14 |
| **Qoder** | qoder | Auto, Ultimate, Performance, Efficient, Lite, Qwen-Coder-Qoder, Qwen3.5-Plus, GLM-5, Kimi-K2.5, MiniMax-M2.5 | 2026-03-14 |
| **Trae-CN** | trae-cn | Doubao-Seed-2.0-Code, Doubao-Seed-1.8, Doubao-Seed-Code, MiniMax-M2.5, MiniMax-M2.1, MiniMax-M2, GLM-5, GLM-4.7, GLM-4.6, DeepSeek-V3.1-Terminus, Kimi-K2.5, Kimi-K2-0905, Qwen3.5-Plus, Qwen3-Coder-Next | 2026-03-14 |
| **Trae** | trae | Gemini-3-Pro-Preview, Gemini-2.5-Pro, Gemini-3-Flash-Preview, Gemini-2.5-Flash, Kimi-K2-0905, GPT-5.3-Codex, GPT-5.2-Codex, GPT-5.2, GPT-5.1, GPT-5-medium, GPT-5-high, DeepSeek-V3.1 | 2026-03-15 |
| **JoyCode** | joycode | JoyAI-Code, Kimi-K2-250905, Doubao-Seed-1.6, DeepSeek-V3.1 | 2026-03-14 |
| **Comate** | comate | GLM-4.7, GLM-5.0, Kimi K2.5, MiniMax M2.5 | 2026-03-15 |
| **CodeBuddy-CN** | codebuddy-cn | MiniMax-M2.5, GLM-5.0, GLM-4.7, Kimi-K2.5, Kimi-K2-Thinking, DeepSeek-V3.2 | 2026-03-15 |
| **CodeBuddy** | codebuddy | GLM-5.0, Kimi-K2.5, GPT-5.4, GPT-5.3-Codex, GPT-5.2-Codex, GPT-5.2, GPT-5.1, GPT-5.1-Codex-Max, Gemini-3.0-Pro, Gemini-3.0-Flash, DeepSeek-V3.2 | 2026-03-15 |
| **Cascade** | cascade | SWE-1.5（Windsurf 内置 AI 代理） | 2026-03-15 |
| **Windsurf** | windsurf | GLM-5, Grok Code Fast 1, Kimi K2.5, Minimax M2.1, Minimax M2.5, SWE-1.5, SWE-1.5 Fast, Gemini 3 Flash Low, GPT-5.2 Low Thinking, GLM 4.7 | 2026-03-15 |
| **Cursor** | cursor | Composer 1.5, Composer 1, GPT-5.2 Low, Claude 4.5 Haiku, Gemini 3 Flash, GPT-5.1 Mini | 2026-03-15 |
| **Verdent** | verdent | Claude Sonnet 4.6, Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3 Flash, GPT-5.4, GPT-5.3-Codex, Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, GPT-5.2, GPT-5.1, GPT-5, MiniMax M2.5, GLM 5, Kimi K2.5, Kimi K2 Turbo | 2026-03-15 |
| **OpenCode** | opencode | GLM-4.6(Big Pickle), GPT-5 Nano, MiMo V2 Flash Free, MiniMax M2.5 Free, Nemotron 3 Super Free | 2026-03-15 |
| **Visual Studio Code** | vscode | Claude Haiku 4.5, GPT-4.1, GPT-4o, GPT-5 mini, Raptor mini | 2026-03-15 |
| **Dropstone** | dropstone | DeepSeek V3.2, Moonshot Kimi K2.5 | 2026-03-15 |
| **TalkCody** | talkcody | MiniMax M2.5 | 2026-03-15 |
| **Kiro** | kiro | Claude Sonnet 4, Claude Haiku 4.5, DeepSeek v3.2, Minimax M2.1, Qwen3 Coder Next | 2026-03-14 |
| **Copilot** | copilot | Claude Haiku 4.5, GPT-4.1, GPT-4o, GPT-5 mini, Raptor mini | 2026-03-14 |

---

## 主体分类

按 `.subjects.json` 中的角色分类：

| 角色 | 成员 |
| :--- | :--- |
| **Lead（主导）** | Antigravity |
| **Engineering（工程）** | Cursor, Windsurf, Trae, Trae-CN, Codex, Copilot, Verdent, Kiro, OpenCode |
| **Auditors（审计）** | Lingma, Comate, CodeBuddy, CodeBuddy-CN, JoyCode, CatPawAI, Qoder, Cascade, Dropstone, TalkCody, Kimi-CloseClaw |
| **Cloud** | Jules-Bolt, Jules-Palette, Jules-Sentinel |
| **IDE Only** | Visual Studio Code |

---

## 注册规范

新协作主体加入时需完成：

1. 在本文件末尾追加一行注册记录
2. 更新 `.subjects.json` 对应分类数组
3. 在 `registered_ide/` 目录创建 `{id}_registration.md` 文件（可选，用于详细声明）
4. **无需修改** `groups/global/CONTEXT.md`

---

> **最后更新**: 2026-03-16 — Verdent (Claude Sonnet 4.6) 将协作主体信息从 CONTEXT.md 迁移至本文件
