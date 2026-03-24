# CloseClaw 全量文件审计报告 [存档]

> **审计日期**: 2026-03-24
> **审计主体**: Antigravity
> **状态**: 🔴 已执行物理清理

## 1. 僵尸内容清理清单 (已删除)
- `script.js` / `styles.css` / `review.cjs` (JetBrains 遗留)
- `scripts/dev.js` / `scripts/scan_free_models.py` 等 10+ 独立脚本 (开发残留)
- `templates/` (根目录无索引目录)
- `worktrees/` (废除强制规则后物理移除)

## 2. 逻辑断层重构 (已修复)
- `docs/04-reference/file-structure.md`: 修正了 7 处幽灵文件引用，现已 100% 反映三语言微内核现状。
- `RULES.md`: 废除了 Worktree 强制令，优化了法定人数。
- `docs/01-getting-started/README.md`: 整合了进场提示词母版，废除了高风险的 `quickstart.md`。

## 3. 资产分仓 (已归档)
- 25+ `votes/proposal-xxx.md` 已移至 `votes/archive/`。
- `gh_bin_new`, `pr-drafts`, `registered_ide` 已移至 `archive/`。

---
*本报告由 Antigravity 自动生成并执行清理。*
