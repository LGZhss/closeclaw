# P027 Phase 1: Go 内核总线与 SQLite WAL 极限并发压测

## 📌 核心目标
建立 `kernel/` 并引入 `mattn/go-sqlite3`（需 CGO），重写核心表结构（如 tasks/groups），并编写高并发压测代码 `kernel/db/bench_test.go`。验收线：10k 混合查询 ≤ 0.8ms，1000条批量插入 ≤ 150ms。

## ⚠️ 强制性纪律 (ANTI-LAZINESS)
本环境信任你的自主架构推演能力，但你**必须严格遵守**以下红线：
1. **[禁止占位符]**：不要输出诸如 `func InitDB() { // TODO: 真实连接池配置 }` 的废物代码。你必须提交完整的、开启了 `PRAGMA journal_mode=WAL;` 和精调连接并发数的**真实生产级代码**。
2. **[硬核凭证]**：在交付报告或 PR 中，必须包含通过真实执行 `go test -bench .` 所获得的真实并发耗时与 allocs 数据。严禁捏造虚假性能日志。
3. **[独立解题]**：如果在 Windows 下遇到 CGO 编译地狱，不要把问题抛回给用户。你自己查文档、写解决脚本或提出可行的替代方案并代码化。

完成开发后，提交至 `proposal/027-phase1-part2` 分支。
