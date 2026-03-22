# Git 操作命令 - Proposal 021

## 🔧 创建 PR 的完整命令

### 1. 检查当前状态

```bash
# 查看当前分支
git branch

# 查看修改的文件
git status
```

### 2. 创建并切换到新分支

```bash
git checkout -b feature/phase-0-2-implementation
```

### 3. 暂存所有更改

```bash
git add .
```

### 4. 查看将要提交的内容

```bash
git status
```

### 5. 提交更改

```bash
git commit -m "feat: Phase 0-2 实施完成

Phase 0 - 关键 Bug 修复:
- 修复 B1: 添加 getRouterState import
- 修复 B2: 实现正确的 JID → groupFolder 映射
- 修复 B3: 移除 chokidar 依赖
- 清理 C5: 删除容器残留类型和常量
- 修复 C7: 重命名 activeContainers → activeAgents

Phase 1 - Agent 执行链路:
- 新增 LLM Adapter 接口和 Registry
- 迁移 OpenAI Adapter 至 TypeScript
- 新增 Agent Runner 接口和 Sandbox Runner 实现
- 集成 SandboxRunner 到主流程

Phase 2 - Telegram Channel:
- 实现 TelegramChannel 类（Long Polling + 错误处理）
- 新增 42 个单元测试
- 验证 Telegram Bot Token 和 LLM API Keys
- 新增启动脚本（start.bat, start-dev.bat）
- 更新 README 配置说明

测试结果:
- 152/152 测试通过
- TypeScript 编译成功
- 删除 3 个过时测试（ipc, group-queue, db）

关联提案: #020, #021"
```

### 6. 推送到远程仓库

```bash
git push origin feature/phase-0-2-implementation
```

### 7. 创建 PR（使用 GitHub CLI）

```bash
gh pr create \
  --title "Phase 0-2 实施完成：关键 Bug 修复、Agent 执行链路与 Telegram Channel" \
  --body-file pr-drafts/proposal-021-phase-0-2-implementation/PR_BODY.md \
  --base main
```

### 8. 或者手动创建 PR

1. 访问 GitHub 仓库页面
2. 点击 "Pull requests" → "New pull request"
3. 选择 base: `main`, compare: `feature/phase-0-2-implementation`
4. 复制 `pr-drafts/proposal-021-phase-0-2-implementation/PR_BODY.md` 的内容到 PR 描述
5. 点击 "Create pull request"

---

## 🔄 合并后操作

### 1. 切换回 main 分支

```bash
git checkout main
```

### 2. 拉取最新代码

```bash
git pull origin main
```

### 3. 删除本地功能分支（可选）

```bash
git branch -d feature/phase-0-2-implementation
```

### 4. 删除远程功能分支（可选）

```bash
git push origin --delete feature/phase-0-2-implementation
```

---

## 📝 提交信息规范

本次提交遵循 Conventional Commits 规范：

- **类型**: `feat` (新功能)
- **范围**: Phase 0-2
- **描述**: 简短说明（50 字符内）
- **正文**: 详细的变更列表
- **Footer**: 关联提案编号

---

## ✅ 提交前检查清单

- [x] 所有测试通过（152/152）
- [x] TypeScript 编译成功
- [x] 代码格式化完成
- [x] 提案文档已创建（proposal-021）
- [x] PR 文档已准备
- [x] 启动脚本已创建
- [x] README 已更新

---

## 🚀 快速执行（一键复制）

```bash
# 创建分支并提交
git checkout -b feature/phase-0-2-implementation
git add .
git commit -m "feat: Phase 0-2 实施完成

Phase 0 - 关键 Bug 修复:
- 修复 B1: 添加 getRouterState import
- 修复 B2: 实现正确的 JID → groupFolder 映射
- 修复 B3: 移除 chokidar 依赖
- 清理 C5: 删除容器残留类型和常量
- 修复 C7: 重命名 activeContainers → activeAgents

Phase 1 - Agent 执行链路:
- 新增 LLM Adapter 接口和 Registry
- 迁移 OpenAI Adapter 至 TypeScript
- 新增 Agent Runner 接口和 Sandbox Runner 实现
- 集成 SandboxRunner 到主流程

Phase 2 - Telegram Channel:
- 实现 TelegramChannel 类（Long Polling + 错误处理）
- 新增 42 个单元测试
- 验证 Telegram Bot Token 和 LLM API Keys
- 新增启动脚本（start.bat, start-dev.bat）
- 更新 README 配置说明

测试结果:
- 152/152 测试通过
- TypeScript 编译成功
- 删除 3 个过时测试（ipc, group-queue, db）

关联提案: #020, #021"

# 推送并创建 PR
git push origin feature/phase-0-2-implementation
gh pr create --title "Phase 0-2 实施完成：关键 Bug 修复、Agent 执行链路与 Telegram Channel" --body-file pr-drafts/proposal-021-phase-0-2-implementation/PR_BODY.md --base main
```

