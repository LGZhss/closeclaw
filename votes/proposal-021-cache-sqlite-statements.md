# Proposal 021: Cache `better-sqlite3` prepared statements

✅ 已通过（用户提出特批）

## 目前的性能瓶颈
在 `src/db.ts` 中，频繁调用的高频操作（如 `insertMessage`, `getUnprocessedMessages`, `getMessagesSince`, `getRegisteredGroup` 等）每次都会在函数内部重新执行 `db.prepare(sql)`。这意味着每次插入消息或查询轮询时，SQLite 都要去重复进行 SQL 编译。
基准测试表明，在大量插入或频繁查询时，这种重复编译会导致开销增加 3~4 倍。这对于核心的消息处理流水线和基于轮询的应用系统而言，这是一个明显的性能下降。

## 你的优化思路
针对高频执行的查询操作，将 `db.prepare()` 实例缓存起来（懒加载方式），以便在同一个生命周期内复用。
由于在 `db.ts` 模块加载时，如果表还未初始化，直接在顶层调用 `db.prepare()` 可能会导致“no such table”报错（特别是在某些测试用例或者环境启动初期）。因此，最安全有效的方式是在模块顶部或函数外部声明变量缓存语句，只有在函数第一次被调用执行时进行赋值 `if (!stmt) stmt = db.prepare(...)`。之后只需调用 `stmt.run()` 或 `stmt.all()` 等，即可绕过重复编译步骤。

这能够在极少修改代码结构和提升极低内存损耗的前提下，使得系统整体 IO 更加轻量化，大幅降低 CPU 开销。

## 预期的 Diff 变更
- 修改 `src/db.ts`
- 引入局部模块级别的变量，例如 `let insertMessageStmt: ReturnType<typeof db.prepare>;` 等，为高频操作函数实现 Statement 的懒加载缓存。
- 不影响现有的函数签名，保持对外 API 行为的一致性，通过所有既有单元测试与 E2E 测试。
