# Bugfix Requirements Document

## Introduction

提案020 Phase 0 - 关键 Bug 修复。当前代码库存在5个关键问题，导致系统无法正常运行：运行时引用错误（B1）、消息路由失败（B2）、模块加载崩溃（B3）、以及架构残留污染（C5、C7）。本次修复确保系统可以稳定启动并通过所有测试。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN router.ts 调用 getRouterState 函数时 THEN 系统抛出 ReferenceError: getRouterState is not defined

1.2 WHEN processGroup 函数使用 chatJid 作为 groupFolder 参数时 THEN 消息永远无法路由到正确的 group（因为 chatJid 和 groupFolder 是不同的标识符）

1.3 WHEN 系统启动加载 src/ipc.ts 模块时 THEN 系统抛出 Cannot find module 'chokidar' 错误导致进程崩溃

1.4 WHEN 代码中引用 ContainerConfig、MountConfig 类型和 CONTAINER_IMAGE 等常量时 THEN 这些已废弃的容器相关代码仍然存在于类型定义和配置文件中

1.5 WHEN 阅读 group-queue.ts 代码中的 activeContainers 变量名时 THEN 变量名含义与当前架构（已移除容器）不符，造成语义混淆

### Expected Behavior (Correct)

2.1 WHEN router.ts 调用 getRouterState 函数时 THEN 系统应该正确从 db.js 导入该函数并成功执行

2.2 WHEN processGroup 函数需要获取 groupFolder 时 THEN 系统应该通过 chatJid 查找 registered_groups 表获取对应的 folder 字段

2.3 WHEN 系统启动加载 src/ipc.ts 模块时 THEN 系统应该使用 Node.js 原生 fs.watch 或轮询机制替代 chokidar，确保模块正常加载

2.4 WHEN 清理容器残留代码时 THEN 系统应该删除 types.ts 中的 ContainerConfig 和 MountConfig 类型定义、config.ts 中的 CONTAINER_IMAGE 等常量、以及 db.ts 中 registered_groups 表的 container_config 字段

2.5 WHEN 重命名 group-queue.ts 中的变量时 THEN activeContainers 应该重命名为 activeAgents 以反映当前架构（基于 Agent 而非容器）

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 系统运行 npm test 时 THEN 所有现有测试应该继续通过

3.2 WHEN 系统运行 npm run typecheck 时 THEN TypeScript 类型检查应该零错误

3.3 WHEN router.ts 中其他已正确导入的函数被调用时 THEN 这些函数应该继续正常工作

3.4 WHEN db.ts 中其他数据库操作被执行时 THEN 这些操作应该继续正常工作（除了 container_config 字段的读写）

3.5 WHEN group-queue.ts 的队列逻辑被执行时 THEN 队列的并发控制和任务调度行为应该保持不变

3.6 WHEN 系统使用 MAX_CONCURRENT_CONTAINERS 常量时 THEN 该常量的功能应该保持不变（尽管名称可能在后续阶段重命名）

3.7 WHEN ipc.ts 中的其他 IPC 功能（writeMessage、readMessage 等）被调用时 THEN 这些功能应该继续正常工作
