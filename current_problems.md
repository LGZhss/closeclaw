# CloseClaw 当前待办问题与质量缺陷报告 (2026-03-24)

本文件由 Antigravity 通过自动审计生成。请优先处理 [P0] 与 [P1] 级别问题。

## 🔴 级别: 紧急 [P0] - 安全与生存

| ID | 平台 | 描述 | 文件 | 建议操作 |
| :--- | :--- | :--- | :--- | :--- |
| **S01** | Dependabot | ✅ 已修复：gRPC-Go 权限绕过 | `go.mod` | 已升级至 `1.79.3` |
| **B01** | GitHub Actions | ✅ 已修复：CI/CD 构建阻塞 | `.github/workflows/release.yml` | 已修正路径并添加创建目录步序 |
| **B02** | SonarCloud | ✅ 已修复：数据库事务泄露 | `kernel/db/messages_test.go` | 已补全 `defer tx.Rollback()` |

## 🟠 级别: 重要 [P1] - 可靠性与安全

| ID | platform | 描述 | 文件 | 建议操作 |
| :--- | :--- | :--- | :--- | :--- |
| **S02** | Dependabot | ✅ 已修复：`x/net` 安全漏洞 | `go.mod` | 已升级至最新稳定版 |
| **B03** | SonarCloud | ✅ 已修复：逻辑错误：恒假严等比较 | `scripts/auto-vote-stats.js` | 已修正为数值对齐比较 |
| **B04** | Qodana | 运行时路径不一致：Node/Go 缓存失效 | GitHub Workflows | 统一工作目录映射，精准对齐 `/kernel` 与 `/src` |

## 🟡 级别: 建议 [P2] - 代谢与维护

- **代码重复率**: 目前为 **25.2%**，主要集中在脚本工具与测试固件。
- **Lint 警告**: 累计 **556** 条警告。建议执行 `npm run format:fix` 并批量清理 ShellCheck 报警。
- **代码可读性**: Qodana 标记了 8 处 TypeScript 与 Dart 的可维护性异味。

---
> **状态索引**: 🔴 修复中 | 🟠 待处理 | 🟡 观察中
