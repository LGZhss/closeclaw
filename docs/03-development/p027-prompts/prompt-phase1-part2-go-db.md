# P027 Phase 1 拆解任务 B: Go 内核与 WAL 大并发压测

## 🎯 任务背景
P027 决策以 `mattn/go-sqlite3` 构建底层状态神经中枢，取代以往低效的 TS 方案和高门槛的 Rust 方案。此环节为整个架构最核心的数据持久底座验证。

## 📋 你的职责
你是一名 Go 并发优化专家（512K 上下文）。你的唯一战场是 `kernel/` 目录。不必关心外部的 Dart 守护和 TS 沙盒执行。

### 具体要求：
1. 在根目录创建 `kernel/` 目录，并初始化 Go mod (`go mod init closeclaw-kernel`)。
2. 建立 `kernel/db/schema.go`，设计包含 `groups`, `tasks`, `sessions`, `messages` 的初始建表语句。
   - **关键**: 必须在初始化时开启 `PRAGMA journal_mode=WAL;` 和 `PRAGMA synchronous=NORMAL;`。
3. 建立并实现压测入口 `kernel/db/bench_test.go`：
   - 使用 Go 内置的 `testing` 模块。
   - 编写 `BenchmarkSQLiteWrite` 和 `BenchmarkSQLiteBatchInsert`。
   - 实现高并发下 `sqlite3` driver 争用的压测（例如 100个 goroutine 齐射插入 task，测试驱动在 WAL 模式下是否报错 `database is locked`，验证超时重试的最佳连接池大小 `SetMaxOpenConns(1)` 方案或更优配置）。
   - **验收及格线**: 1000条批量插入 ≤ 150ms，10k次单查询或混合读写尽量逼近 0.8ms 量级。

## ⚠️ 提交交付
- 提交 PR 到 `proposal/027-phase1-part2` 分支。
- 你必须在本地运行并附上 `go test -bench .` 的结果日志，验证符合 P027 的通过线。
- 请说明如果是 Windows 系统下，CGO 库依赖是否编译顺畅。
