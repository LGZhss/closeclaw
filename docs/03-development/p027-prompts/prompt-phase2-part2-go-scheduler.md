# P027 Phase 2 Part 2: Go Kernel 接管 `task-scheduler.ts`
> 🎯 **目标**: 将原本基于 Node.js 的调度器和组队列（`src/task-scheduler.ts`, `src/group-queue.ts`）迁移为 Go 的高并发 Goroutine 调度。

## 1. 业务上下文分析
原有 TS 调度架构痛点：
- `group-queue.ts`: 基于 JS 事件循环在单线程维护并发队列锁，容易受限于 V8 引擎负载，无法发挥多核优势。
- `task-scheduler.ts`: 使用 `setInterval` 轮询 SQLite 表，计算 Cron 表达式，当并发量达到上限（如 > 32 个终端）时，可能出现超时阻塞。

## 2. 实施方案
在 Go 里面使用 Channels 和 Goroutines 构建超高性能的协程调度池：`kernel/scheduler`
- 引入 Go 的 `robfig/cron/v3` 替代 Node 的 `cron-parser`。
- 实现 `TaskPool` 替代 `groupQueue`，通过 sync.Mutex 和 Semaphore 控制每个群组（Group）只能同时跑一个沙盒实例。
- 全权接管定时的 DB 轮询。当检测到需要执行 Task 时，通过 gRPC 管道唤醒休眠的无状态 TS 沙盒进程去跑对应业务指令。

## 3. 验收标准
- [ ] 创建 `kernel/scheduler/cron.go` 解析定时任务。
- [ ] 创建 `kernel/scheduler/pool.go` 实现 goroutine 并发限制队列（对应 ts 的 `group-queue`）。
- [ ] 在 `kernel/db/bench_test.go` 基础上新增并发调度测试，确保并发 100 任务时不出现竞态或死锁。
