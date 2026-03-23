# P027 Phase 2 Part 4: TypeScript 降级无状态沙盒
> 🎯 **目标**: 抽离所有残留的 SQLite 持久化和定时调度逻辑，让 Node.js 成为纯粹的业务执行环境。

## 1. 业务上下文分析
经过 Part 1 和 Part 2，TS 侧的 `db.ts`, `router.ts`, `task-scheduler.ts` 以及 `group-queue.ts` 的核心业务都已经沉降到 Go 并用 Channel 和 Goroutine 接管。
现在，原先 `package.json` 里的各种笨重依赖不再由主引擎直接加载，而是被隔离在一个无权访问本地 `data/` 数据库目录的沙盒里。

## 2. 实施方案
1. **清理无用层级**：删除 `src/db.ts` 和所有直接引用 `better-sqlite3` 的代码。
2. **重写 Adapter**：将原先 `SandboxRunner` 和 `LLMAdapter` 改为只接收 Go 侧发来的 gRPC `DispatchTask`，然后调用对应的 npm UI 组件或渲染逻辑，把结果通过 `StatusUpdate` gRPC 流回推给 Go。
3. **隔离机制**：配置严格的 Node.js file system 权限策略，只能操作特定 group 的虚拟目录，强制脱壳。

## 3. 验收标准
- [ ] 移除 `better-sqlite3` 系列及 `cron-parser`。
- [ ] 重写 `src/index.ts` 为 gRPC Client 监听程序，去状态化。
- [ ] 跑通 TS SDK 收到 Go 的任务、返回假数据的一条鞭链路测试。
- [ ] 更新 `package.json` 的入口和启动脚本。
