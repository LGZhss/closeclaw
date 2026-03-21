# 提案：缓存剩余的 SQLite 查询语句

**状态**: ✅ 已通过（用户提出特批）
**提案人**: @Jules-Bolt
**受影响的模块**: `src/db.ts`

## 1. 背景与问题
在 `src/db.ts` 中，我们之前已经为部分高频函数（如 `insertMessage`, `getUnprocessedMessages` 等）实现了懒加载的 `db.prepare()` 缓存机制，避免了 SQLite 语句的重复编译，从而大幅提升了性能。然而，目前文件中仍有 18 个函数（例如 `setRegisteredGroup`, `getDueTasks`, `updateTaskNextRun`, `getTasksByGroup` 等）每次调用都会重新执行 `db.prepare(...)`。由于某些函数在应用生命周期中会被高频调用（如任务调度或状态获取），这种重复编译仍然带来了不必要的性能开销。

## 2. 优化方案
按照已有的懒加载缓存模式，将剩余的静态 SQL 查询转换为复用的缓存语句。动态 SQL 查询（如 `updateTask`）因其参数结构的动态性，不包含在本次优化范围内。

具体修改：
为以下每个函数外部增加 `let XXXStmt: ReturnType<typeof db.prepare>;` 声明，并在函数内部增加 `if (!XXXStmt) XXXStmt = db.prepare(...);`：
- `setRegisteredGroup`
- `getAllRegisteredGroups`
- `deleteRegisteredGroup`
- `getMainGroup`
- `insertTask`
- `getDueTasks`
- `updateTaskNextRun`
- `getTasksByGroup`
- `getAllTasks`
- `getTask`
- `deleteTask`
- `insertTaskLog`
- `getTaskLogs`
- `setSession`
- `getSession`
- `setRouterState`
- `getRouterState`

## 3. 预期收益
消除剩余的每次函数调用时的 SQLite 解析与编译开销。这可以降低 Node.js 的 CPU 使用率，并缩短这些特定 DB 操作的时间。

## 4. diff 变更说明
修改 `src/db.ts`，为上述 17 个函数引入与之前 `insertMessage` 等相同的懒加载 `better-sqlite3` prepared statement 缓存逻辑。对于 `.run()` 返回 `unknown` 类型进而引发 TypeScript 检查报错的问题，按照已有的妥协处理，使用 `(XXXStmt as any).run(...)` 或类似方式绕过。