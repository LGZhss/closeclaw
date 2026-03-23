# PR 创建指南 - Proposal 021

## 📋 PR 信息

- **标题**: `Phase 0-2 实施完成：关键 Bug 修复、Agent 执行链路与 Telegram Channel`
- **分支**: `feature/phase-0-2-implementation`
- **目标分支**: `main`
- **关联提案**: 提案 020, 提案 021

---

## 🔧 创建 PR 步骤

### 1. 创建并切换到新分支

```bash
git checkout -b feature/phase-0-2-implementation
```

### 2. 暂存所有更改

```bash
git add .
```

### 3. 提交更改

```bash
git commit -m "feat: Phase 0-2 实施完成

- Phase 0: 修复 5 个关键 Bug (B1/B2/B3/C5/C7)
- Phase 1: 实现 Agent 执行链路 (Adapter + Runner)
- Phase 2: 实现 Telegram Channel (Long Polling + 错误处理)
- 新增 92 个测试，全部通过
- 新增启动脚本 (start.bat, start-dev.bat)
- 更新 README 配置说明

关联提案: #020, #021"
```

### 4. 推送到远程仓库

```bash
git push origin feature/phase-0-2-implementation
```

### 5. 创建 PR

使用 GitHub CLI（推荐）:

```bash
gh pr create --title "Phase 0-2 实施完成：关键 Bug 修复、Agent 执行链路与 Telegram Channel" --body-file pr-drafts/proposal-021-phase-0-2-implementation/PR_BODY.md --base main
```

或手动在 GitHub 网页创建 PR，复制 `PR_BODY.md` 的内容。

---

## 📝 PR Body 预览

PR Body 内容已准备在 `PR_BODY.md` 文件中，包含：

- 提案背景和概述
- Phase 0-2 的详细实施内容
- 代码变更统计
- 测试覆盖报告
- 功能验证流程
- 使用说明
- 验收标准清单

---

## ✅ 合并前检查清单

- [x] 所有测试通过（92/92）
- [x] TypeScript 编译成功
- [x] Token 验证完成
- [x] 提案 021 已创建并通过
- [ ] PR 已创建
- [ ] CI/CD 检查通过（如有）
- [ ] Code Review 完成（如需要）
- [ ] 用户批准合并

---

## 🚀 合并后操作

1. 删除功能分支（可选）:
   ```bash
   git branch -d feature/phase-0-2-implementation
   git push origin --delete feature/phase-0-2-implementation
   ```

2. 更新本地 main 分支:
   ```bash
   git checkout main
   git pull origin main
   ```

3. 开始 Phase 3 实施（如需要）

