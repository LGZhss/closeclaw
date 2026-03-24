# 提案：缓存剩余的 SQLite 查询语句

**状态**: ✅ 已通过（用户提出特批）
**提案人**: @Jules-Bolt
**受影响的模块**: `src/db.ts`

## 1. 背景与问题
在 `src/db.ts` 中，虽然部分高频函数（如 `insertMessage`, `getUnprocessedMessages`）已经应用了懒加载机制缓存 `better-sqlite3` 的 `db.prepare()` 语句，但文件中仍有 17 个函数在每次调用时重复编译 SQL 语句（例如 `setRegisteredGroup`, `getDueTasks`, `updateTaskNextRun`, `getTasksByGroup` 等）。在持续轮询或高频触发的场景下，这会导致额外的 CPU 消耗和查询延迟。

## 2. 优化方案
为保持 `src/db.ts` 内部的一致性，并将性能提升最大化，建议将剩余的静态查询也采用相同的懒加载模式：
- 为每个操作声明模块级缓存变量（如 `let setRegisteredGroupStmt: ReturnType<typeof db.prepare>;`）。
- 在函数体内部进行懒加载初始化：`if (!setRegisteredGroupStmt) setRegisteredGroupStmt = db.prepare(...);`。
- 执行时使用 `(setRegisteredGroupStmt as any).run(...)` 或 `.all()` 绕过 TypeScript 检查参数数目的报错（遵循代码库中已有的变通方案）。
- 动态 SQL 查询（如 `updateTask`）不纳入缓存范围。

## 3. 预期收益
通过消除这些函数每次执行时 SQLite 的解析和编译过程，减少 CPU 的消耗，进一步提升整个数据库访问层的吞吐量与性能表现。

## 4. diff 变更说明
在 `src/db.ts` 中，为 `setRegisteredGroup`, `getAllRegisteredGroups`, `deleteRegisteredGroup`, `getMainGroup`, `insertTask`, `getDueTasks`, `updateTaskNextRun`, `getTasksByGroup`, `getAllTasks`, `getTask`, `deleteTask`, `insertTaskLog`, `getTaskLogs`, `setSession`, `getSession`, `setRouterState`, `getRouterState` 添加相应的预编译缓存逻辑。
