# CloseClaw Rules - 模型必读规则

> **版本**: 1.0  
> **生效日期**: 2026-03-14  
> **状态**: 🟢 立即生效

---

## 目录

1. [文档结构](#一文档结构)
2. [文件命名](#二文件命名)
3. [提案提交](#三提案提交)
4. [禁止生成](#四禁止生成)
5. [根目录 README](#五根目录-readme)

---

## 一、文档结构

### 📁 目标目录结构

```
docs/
├── README.md (文档中枢)
├── 01-guidelines/ (核心规范)
├── 02-collaboration/ (协作指南)
├── 03-architecture/ (架构设计)
├── 04-planning/ (任务规划)
├── 05-learning/ (学习资源)
├── 06-archive/ (历史归档)
└── 07-proposals/ (提案记录)
```

### 当前说明

当前目录结构正在整理中，不符合规则的文档会移动到 `docs/06-archive/` 目录。

---

## 二、文件命名

### ✅ 正确示例

```
01-guidelines/
├── 01-new-ide-onboarding.md
└── 02-collaboration-rules-v3.md
02-collaboration/
└── 02-workflow/
    └── 01-proposal-submission.md
```

### ❌ 错误示例

```
02-协作指南/ (中文)
NEW_IDE_ONBOARDING.md (大写下划线)
文档整理完成总结.md (总结类)
```

### 命名规范

- **全英文**：使用英文命名
- **小写**：全部小写字母
- **连字符**：单词间用 `-`
- **数字前缀**：文档按顺序编号（`01-`, `02-`）

---

## 三、提案提交

### 用户提出的提案

**状态标注**：
```markdown
> **状态**: ✅ 已通过（用户提出特批）
```

**不要说**：
- ❌ "意见收集中"
- ❌ "投票中"

**votes/README.md**：
- 简述提案摘要
- 只显示提案列表和状态

---

## 四、禁止生成

### 🚫 绝对禁止

```
❌ 文档整理完成总结.md
❌ 根目录清理总结.md
❌ CloseClaw 项目迁移总结.md
❌ MIGRATION_SUMMARY.md
❌ ROOT_CLEANUP_SUMMARY.md
❌ 任何包含"总结"、"完成"、"迁移"、"清理"的文档
```

### ✅ 应该生成

| 类型 | 示例 |
|------|------|
| 项目结构文档 | `file-structure.md` |
| 标准规范 | `document-standards.md` |
| 指南参考 | `proposal-guide.md` |
| 路线图 | `roadmap.md` |

---

## 五、根目录 README

### 📍 开头必须引导

```markdown
# CloseClaw

> 模型必读：请先阅读 [RULES.md](./RULES.md)
>
> 多智能体协同调度中枢
```

---

> **规则版本**: 1.0  
> **创建日期**: 2026-03-14  
> **维护者**: CloseClaw 协作系统

---

**所有模型必须遵守以上规则！** 🚀
