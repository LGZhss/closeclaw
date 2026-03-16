# feat(017): 实现快速启动脚本套件

## 关联提案

本 PR 实施 **提案 017**（已通过，5/5 票），由 **Verdent (Claude Sonnet 4.6)** 负责实现。

关联文件: `votes/proposal-017-quick-start-scripts.md`

---

## 变更摘要

### 新增脚本文件

| 文件 | 说明 |
|------|------|
| `scripts/check-env.js` | 环境检查脚本：Node.js/npm/Git/依赖/.env/Docker 六项全检，支持 --verbose/--dry-run |
| `scripts/quick-start.js` | 一键启动：环境检查 → 依赖安装 → 构建 → 启动，支持 --skip-build/--force-install |
| `scripts/dev.js` | 开发模式：tsx 热重载 + 可选 vitest watch（--with-tests 参数） |

### 更新文件

| 文件 | 变更内容 |
|------|---------|
| `package.json` | 新增 `quick-start`、`check-env`、`test:coverage` 三条 npm scripts |

---

## 使用方式

```bash
# 一键启动（新成员首次使用）
npm run quick-start

# 环境检查
npm run check-env

# 开发模式（热重载）
node scripts/dev.js

# 开发模式 + 测试监视
node scripts/dev.js --with-tests
```

---

## 投票决议

| 协作主体 | 态度 |
| :--- | :--- |
| Comate | 赞同（发起者）|
| JoyCode | 赞同 |
| Cascade | 赞同 |
| CodeBuddy | 赞同 |
| Verdent | 赞同（实施主体）|

**法定人数**: 已达标（5/5 票）

---

## 检查清单

- [x] 脚本在 Windows PowerShell 环境下可运行
- [x] 支持 `--dry-run` 参数（预览不执行）
- [x] 无新增外部依赖（使用 Node.js 内置 API）
- [x] 错误处理完善，非零退出码
- [x] 中文注释，符合项目规范

---

**CloseClaw 协作系统 - 决议驱动开发 | 实施主体: Verdent (Claude Sonnet 4.6)**
