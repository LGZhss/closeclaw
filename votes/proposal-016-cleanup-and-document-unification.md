# 代码修改提案：项目清理与文档统一化

> **提案 ID**: 016
> **提案级别**: 二级
> **发起者**: @System
> **发起日期**: 2026-03-16
> **状态**: ✅ 已通过（用户提出特批）
> **Worktree 分支**: `proposal/016`

---

## 📋 提案说明

### 背景

当前项目存在以下问题需要系统性清理：

1. **Docker 引用残留** - 容器功能已删除，但 README、FILE_STRUCTURE、CONTEXT.md 中仍有引用
2. **Claude Code 依赖** - 项目不再使用 Anthropic API，但文档中仍有大量引用
3. **脚本兼容性问题** - `.sh` 脚本在 Windows 环境无法运行
4. **文档过时** - 模型列表仍停留在 Claude 3.5/GPT-4，与实际不符
5. **文件结构不一致** - 文档描述的目录结构与实际不符
6. **注册流程分散** - 多个文档中的注册流程互相矛盾

### 目标

1. 移除所有 Docker 和容器化相关引用
2. 移除 Claude Code CLI 相关引用
3. 将 `.sh` 脚本转换为 PowerShell 版本（Windows 兼容）
4. 统一并更新 IDE注册流程文档
5. 更新过时的模型列表
6. 修正文件结构描述使其与实际一致

### 实现方案

**清理范围**：

1. **文档清理**
   - 更新 `README.md` - 移除 Docker 和 Claude Code 引用
   - 更新 `docs/reference/FILE_STRUCTURE.md` - 移除 container/ 目录描述
   - 更新 `groups/global/CONTEXT.md` - 移除 Docker 相关说明
   - 更新 `groups/main/CONTEXT.md` - 移除容器管理命令

2. **脚本重写**
   - `scripts/init-dev-dir.sh` → `scripts/init-dev-dir.ps1`
   - `scripts/git-utils.sh` → `scripts/git-utils.ps1`
   - 保留 `.sh` 版本供 Linux/Mac 用户使用

3. **文档统一**
   - 合并 `docs/reference/REGISTRATION_FLOW.md`
   - 合并 `docs/contributing/IDE_ONBOARDING.md`
   - 合并 `docs/collaborators/registry.md`
   - 创建统一的 `docs/guides/IDE_REGISTRATION_GUIDE.md`

4. **模型列表更新**
   - 移除过时的 Claude 3.5/GPT-4 选项
   - 添加当前实际使用的模型（Gemini、Qwen 等）
   - 支持免费模型和聚合服务

### 影响范围

**修改的文件**（预计 15+ 个）：
- `README.md`
- `docs/reference/FILE_STRUCTURE.md`
- `docs/reference/REGISTRATION_FLOW.md`
- `groups/global/CONTEXT.md`
- `groups/main/CONTEXT.md`
- `scripts/init-dev-dir.sh` (新增 PowerShell 版本)
- `scripts/git-utils.sh` (新增 PowerShell 版本)
- 其他相关文档

**新增的文件**：
- `scripts/init-dev-dir.ps1`
- `scripts/git-utils.ps1`
- `docs/guides/IDE_REGISTRATION_GUIDE.md` (统一后的注册指南)

**删除的文件**：
- 过时的注册流程文档（合并后）

**无破坏性变更** - 仅清理和更新文档

### 风险评估

**风险**: 低

**缓解措施**: 
- 保留 `.sh` 脚本的向后兼容性
- 文档更新不影响代码逻辑
- 逐步迁移，确保平滑过渡

---

## 🔗 源码参考

- **Git 分支**: `proposal/016`
- **修改文件列表**:
  - [ ] `README.md` - 移除 Docker/Claude Code 引用
  - [ ] `docs/reference/FILE_STRUCTURE.md` - 更新目录结构
  - [ ] `docs/reference/REGISTRATION_FLOW.md` - 统一注册流程
  - [ ] `groups/global/CONTEXT.md` - 清理 Docker 引用
  - [ ] `groups/main/CONTEXT.md` - 移除容器命令
  - [ ] `scripts/init-dev-dir.ps1` - 新增
  - [ ] `scripts/git-utils.ps1` - 新增
  - [ ] `docs/guides/IDE_REGISTRATION_GUIDE.md` - 新增统一指南

---

## 🗳️ 投票表

### 协作主体投票

| 协作主体 | 态度 | 得分 | 备注 |
|-----|------|------|------|
| System | ✅ 赞同 | +1 | 必要的文档清理 |
| ... | ⬜ | 0 | |

**统计**:
- 参与数：1/N
- 赞同数：1
- 反对数：0
- 弃权数：0
- 协作主体总得分：1

---

### 用户投票

| 用户 | 态度 | 得分 | 备注 |
|-----|------|------|------|
| 用户 | ✅ 赞同 | +0.5 | 支持文档清理和统一化 |

**统计**:
- 参与：是
- 态度：赞同
- 用户得分：0.5

---

## 📊 最终统计

| 项目 | 值 |
|------|-----|
| 协作主体总得分 | 1 |
| 用户得分 | 0.5 |
| 综合总票数 | 1.5 |
| 反对票数量 | 0 |
| 法定人数 | 否（需≥2 个协作主体） |
| **通过状态** | ✅ **通过（用户提出特批）** |

---

## 💬 讨论区

**发起者说明**: 

这是一次必要的技术债务清理：
1. 移除已删除功能的残留引用
2. 提高 Windows 用户体验
3. 统一混乱的文档
4. 更新过时的信息

这将使项目更加清晰、易用、专业。

---

## 📝 更新日志

- [2026-03-16] - 创建提案
- [2026-03-16] - 用户提出特批通过

---

## 📌 参考链接

- [协作规则 v3.0](../docs/guides/COLLABORATION_RULES_v3.md)
- [Worktree 工作流指南](./docs/guides/WORKFLOW_OPTIMIZATION.md)

---

## ⚠️ 注意事项

本次清理涉及多个文档，但不改变核心功能和协作规则。
