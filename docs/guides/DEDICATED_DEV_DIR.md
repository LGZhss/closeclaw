# 专门开发目录配置说明

> **更新日期**: 2026-03-13
> **目的**: 说明专门开发目录的配置和使用

---

## 📂 标准目录结构

```
~/dev/
├── closeclaw/                   # 主项目（main 分支）
│   ├── src/
│   ├── docs/
│   ├── scripts/
│   ├── templates/
│   └── .git/
│
├── closeclaw-proposals/         # 所有提案 worktree（专门目录）
│   ├── proposal-001/            # 提案 001
│   ├── proposal-002/            # 提案 002
│   ├── feature-auth/            # 功能开发
│   └── bugfix-login/            # Bug 修复
│
└── closeclaw-votes/             # 投票文档（可选，与主项目分离）
    ├── proposal-001.md
    └── ...
```

---

## 🎯 核心变更

### 之前
- ❌ 文档中提到多个可选位置
- ❌ 没有统一的目录规范
- ❌ 依赖临时决定

### 现在
- ✅ **统一使用专门目录**: `~/dev/closeclaw-proposals/`
- ✅ **与主项目分离**: 避免混淆
- ✅ **集中管理**: 所有提案在一个地方
- ✅ **环境变量支持**: 可自定义位置

---

## 🔧 配置方法

### 方法 1: 自动配置（推荐）

运行初始化脚本：

```bash
# 在主项目目录
chmod +x scripts/init-dev-dir.sh
./scripts/init-dev-dir.sh
```

**脚本会**：
1. 创建 `~/dev/closeclaw-proposals/` 目录
2. 创建 `~/dev/closeclaw-votes/` 目录（可选）
3. 自动配置环境变量到 shell 配置文件
4. 提供使用说明

---

### 方法 2: 手动配置

**步骤 1: 创建目录**

```bash
mkdir -p ~/dev/closeclaw-proposals
mkdir -p ~/dev/closeclaw-votes
```

**步骤 2: 配置环境变量**

```bash
# Bash (~/.bashrc)
echo 'export CLOSECLAW_WORKTREES_DIR="$HOME/dev/closeclaw-proposals"' >> ~/.bashrc
source ~/.bashrc

# Zsh (~/.zshrc)
echo 'export CLOSECLAW_WORKTREES_DIR="$HOME/dev/closeclaw-proposals"' >> ~/.zshrc
source ~/.zshrc
```

**步骤 3: 验证**

```bash
echo $CLOSECLAW_WORKTREES_DIR
# 输出：/home/your-username/dev/closeclaw-proposals
```

---

## 🚀 使用示例

### 创建提案

```bash
# 创建提案 worktree（自动在 ~/dev/closeclaw-proposals/proposal-001）
./scripts/git-utils.sh create 001 voting-feature

# 进入工作目录
cd ~/dev/closeclaw-proposals/proposal-001

# 开始开发
# ... 编写代码 ...
```

---

### 查看提案

```bash
# 查看所有提案
ls -la ~/dev/closeclaw-proposals/

# 查看当前 worktree 位置
git worktree list
```

---

### 清理提案

```bash
# 使用工具脚本清理
./scripts/git-utils.sh cleanup 001

# 或手动清理
rm -rf ~/dev/closeclaw-proposals/proposal-001
```

---

## 📊 优势对比

### 与项目同级目录对比

| 特性 | 专门目录 | 项目同级 |
|------|---------|---------|
| **集中管理** | ✅ 所有提案在一起 | ❌ 分散在主项目周围 |
| **与主项目分离** | ✅ 完全分离 | ❌ 容易混淆 |
| **备份** | ✅ 可以单独备份 | ❌ 需要区分 |
| **权限管理** | ✅ 可以独立设置 | ❌ 与主项目共享 |
| **清晰度** | ✅ 一目了然 | ⚠️ 目录较多 |

---

### 与临时目录对比

| 特性 | 专门目录 | 临时目录 |
|------|---------|---------|
| **持久性** | ✅ 长期保存 | ❌ 系统重启可能丢失 |
| **组织性** | ✅ 有序管理 | ❌ 随意创建 |
| **可追溯** | ✅ 容易查找历史 | ❌ 难以追踪 |
| **协作** | ✅ 团队成员共享 | ❌ 个人临时使用 |

---

## 🔍 环境变量

### 默认值

```bash
CLOSECLAW_WORKTREES_DIR="$HOME/dev/closeclaw-proposals"
```

### 自定义

```bash
# 在 shell 配置文件中设置
export CLOSECLAW_WORKTREES_DIR="/your/custom/path"

# 或在运行时指定
CLOSECLAW_WORKTREES_DIR="/custom/path" ./scripts/git-utils.sh create 001 feature-name
```

---

## 📝 工具脚本更新

### git-utils.sh

**变更**：
- ✅ 默认使用 `~/dev/closeclaw-proposals/`
- ✅ 自动创建目录（如不存在）
- ✅ 支持环境变量覆盖

**使用**：
```bash
# 默认行为（使用专门目录）
./scripts/git-utils.sh create 001 feature-name
# 实际路径：~/dev/closeclaw-proposals/proposal-001

# 自定义路径（环境变量）
CLOSECLAW_WORKTREES_DIR="/custom/path" ./scripts/git-utils.sh create 001 feature-name
```

---

### init-dev-dir.sh（新增）

**功能**：
- ✅ 创建专门开发目录
- ✅ 创建投票文档目录
- ✅ 配置环境变量
- ✅ 提供使用说明

**使用**：
```bash
chmod +x scripts/init-dev-dir.sh
./scripts/init-dev-dir.sh
```

---

## 📚 相关文档

- [环境配置指南](./ENVIRONMENT_SETUP.md) - 详细配置说明
- [Worktree 工作流](./WORKFLOW_OPTIMIZATION.md) - 完整流程
- [快速参考指南](./QUICK_GUIDE.md) - 快速上手

---

## ✅ 检查清单

配置完成后检查：

- [ ] 运行了初始化脚本
- [ ] `~/dev/closeclaw-proposals/` 目录已创建
- [ ] `~/dev/closeclaw-votes/` 目录已创建（可选）
- [ ] 环境变量已配置
- [ ] 创建了第一个测试 worktree
- [ ] 了解如何查看和清理 worktree

---

## 🆘 故障排除

### 问题 1: 目录创建失败

```bash
# 检查父目录是否存在
ls -la ~/dev/

# 手动创建
mkdir -p ~/dev/closeclaw-proposals

# 检查权限
chmod 755 ~/dev/
```

---

### 问题 2: 环境变量未生效

```bash
# 检查环境变量
echo $CLOSECLAW_WORKTREES_DIR

# 重新加载配置
source ~/.bashrc  # 或 ~/.zshrc

# 验证
echo $CLOSECLAW_WORKTREES_DIR
```

---

### 问题 3: Git 错误

```bash
# 查看所有 worktree
git worktree list

# 清理无效 worktree
git worktree prune

# 删除特定 worktree
git worktree remove ~/dev/closeclaw-proposals/proposal-001
```

---

## 🎉 总结

**专门开发目录的优势**：

1. ✅ **集中管理** - 所有提案在一个地方
2. ✅ **与主项目分离** - 避免混淆
3. ✅ **易于备份** - 可以单独备份提案
4. ✅ **权限清晰** - 主项目和提案独立
5. ✅ **团队协作** - 统一位置，便于共享

**配置简单**：

```bash
# 一行命令完成配置
./scripts/init-dev-dir.sh
```

**使用方便**：

```bash
# 创建提案
./scripts/git-utils.sh create 001 feature-name

# 自动在 ~/dev/closeclaw-proposals/proposal-001
```

---

> **规范的目录结构，高效的开发体验** 🚀
> **CloseClaw - 让协作更简单**
