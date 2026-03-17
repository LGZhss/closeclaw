# Worktree 位置说明

> **创建日期**: 2026-03-13
> **目的**: 澄清 worktree 位置的灵活用法

---

## 核心概念

**Git Worktree 不需要固定的目录！**

你可以将 worktree 创建在**任何位置**：

```bash
# 项目同级目录（默认）
git worktree add ../proposal-001 -b proposal/001

# 专门的开发目录
git worktree add ~/dev/closeclaw-proposals/001 -b proposal/001

# 临时目录
git worktree add /tmp/closeclaw-001 -b proposal/001

# 任何你喜欢的路径
git worktree add /path/to/any/folder -b proposal/001
```

---

## 常见位置选择

### 方案 1：项目同级目录（推荐）

```
closeclaw/          # 主项目
proposal-001/       # 提案 001 worktree
proposal-002/       # 提案 002 worktree
```

**优点**：
- ✅ 路径简单清晰
- ✅ 方便查找
- ✅ 易于管理

**使用方法**：
```bash
# 默认就是创建在项目同级目录
./scripts/git-utils.sh create 001 feature-name
```

---

### 方案 2：专门的开发目录

```
~/dev/
├── closeclaw/              # 主项目
├── closeclaw-proposals/    # 所有提案
│   ├── 001-voting/
│   ├── 002-auth/
│   └── ...
```

**优点**：
- ✅ 所有提案集中管理
- ✅ 可以按功能分类
- ✅ 与主项目分离

**使用方法**：
```bash
# 指定完整路径
./scripts/git-utils.sh create 001 feature-name ~/dev/closeclaw-proposals/001-voting
```

---

### 方案 3：临时目录

```
/tmp/
└── closeclaw-001/    # 临时 worktree
```

**优点**：
- ✅ 不占用永久空间
- ✅ 适合快速审查
- ✅ 系统重启后自动清理

**缺点**：
- ❌ 不适合长期开发
- ❌ 可能意外丢失

**使用方法**：
```bash
# 创建临时 worktree
git worktree add /tmp/closeclaw-001 -b proposal/001
```

---

## 工具脚本的灵活用法

### 默认行为（项目同级目录）

```bash
# 创建在项目同级目录
./scripts/git-utils.sh create 001 feature-name
# 实际路径：../proposal-001
```

### 指定路径

```bash
# 创建在指定路径
./scripts/git-utils.sh create 001 feature-name ~/dev/proposal-001
# 实际路径：~/dev/proposal-001
```

### 查看当前 worktree 位置

```bash
# 列出所有 worktree 及其位置
git worktree list

# 输出示例：
# /home/user/closeclaw           main
# /home/user/proposal-001        proposal/001
# /tmp/review-002                proposal/002
```

---

## 文档中的说明

### 原文档（已更新）

之前文档中提到的 `worktrees/` 目录只是**组织建议**，不是强制要求。

**更新后的文档**：
- ✅ 默认使用项目同级目录
- ✅ 可以指定任意路径
- ✅ 不强制固定目录

---

## 最佳实践建议

### 个人开发

**推荐**：项目同级目录

```bash
closeclaw/
proposal-001/
proposal-002/
```

**理由**：
- 简单直接
- 容易记住位置
- 方便清理

---

### 团队协作

**推荐**：统一的开发目录

```bash
/team-dev/closeclaw/
/team-dev/proposals/001/
/team-dev/proposals/002/
```

**理由**：
- 位置统一
- 便于共享
- 权限管理

---

### 临时审查

**推荐**：临时目录

```bash
/tmp/closeclaw-review-001/
```

**理由**：
- 不占用空间
- 用完即弃
- 保持系统清洁

---

## 常见问题

### Q1: 必须使用 `worktrees/` 目录吗？

**A**: ❌ 不是必须的！

你可以使用任何位置：
```bash
git worktree add ../proposal-001 -b proposal/001
git worktree add ~/dev/proposal-001 -b proposal/001
```

---

### Q2: 如何记住 worktree 的位置？

**A**: 使用 Git 命令查看：
```bash
git worktree list
```

---

### Q3: 可以在不同位置创建多个 worktree 吗？

**A**: ✅ 可以！

每个分支只能有一个 worktree，但不同分支可以在不同位置：
```bash
git worktree add ../proposal-001 -b proposal/001
git worktree add ~/dev/proposal-002 -b proposal/002
git worktree add /tmp/review-003 -b proposal/003
```

---

### Q4: 如何清理 worktree？

**A**: 
```bash
# 删除 worktree 目录
git worktree remove /path/to/worktree

# 或使用工具脚本
./scripts/git-utils.sh cleanup 001
```

---

## 总结

**核心原则**：

1. ✅ **灵活性** - 可以创建在任何位置
2. ✅ **便利性** - 选择你最喜欢的方式
3. ✅ **一致性** - 团队可以约定统一位置（但不强制）

**推荐做法**：

- **个人开发**: 项目同级目录
- **团队协作**: 约定统一位置
- **临时审查**: 临时目录

**工具支持**：

```bash
# 默认（项目同级目录）
./scripts/git-utils.sh create 001 feature-name

# 指定路径
./scripts/git-utils.sh create 001 feature-name /your/path

# 查看位置
git worktree list
```

---

> **记住**: Worktree 的位置是你的选择，不是限制！
> **选择最适合你的方式** 🚀
