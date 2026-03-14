# 提案 009: 部署协作规范框架与外部 Agent 引导补丁

## 状态
✅ 已通过 (用户提出特批)

## 提案背景
为了实现 CloseClaw 项目的多 Agent 协同自治，确保 Google Labs Jules 等外部主体行为可预测、可审计、且符合简体中文协作要求。

## 变更内容
### 1. 法律框架升级
- 将 `RULES.md` 更新至 v1.9，引入“身份备注原则”与“提案同步机制”。
- 部署 `.github/workflows/closeclaw-guard.yml`，对所有 PR 强制执行提案关联检查。

### 2. 外部 Agent 引导 (Patching)
- 在 `.jules/` 目录下为 `Bolt`、`Palette`、`Sentinel` 创建引导文档。
- 强制要求上述主体在工作前读取本地规范，并采用中文备注身份。

### 3. 术语泛化
- 全局将“IDE”术语替换为“协作主体 (Collaboration Subject)”，以兼容 CLI 和自动化工具。

### 4. 工具链集成
- 部署本地 `gh` CLI 工具。
- 实现 `src/adapters/mcp-bridge.ts` 以支持 Chrome MCP 协议。

## 验证证据
- 所有改动已通过 `git push` 同步至 main 分支。
- 术语更替已通过 Python 脚本全量完成。

## 备注
- `Proposal-By`: Antigravity
- `Implemented-By`: Antigravity
