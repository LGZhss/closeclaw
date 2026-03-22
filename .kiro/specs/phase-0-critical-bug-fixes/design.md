# Phase 0 关键 Bug 修复设计文档

## Overview

本设计文档针对提案020 Phase 0 中识别的 5 个关键 Bug 提供修复方案。这些 Bug 导致系统无法正常启动和运行：运行时引用错误（B1）、消息路由失败（B2）、模块加载崩溃（B3）、以及架构残留污染（C5、C7）。修复策略采用最小化改动原则，确保系统稳定性和测试通过率。

## Glossary

- **Bug_Condition (C)**: 触发 Bug 的条件 - 包括缺失导入、错误的标识符映射、缺失依赖、以及过时的类型定义
- **Property (P)**: 期望的正确行为 - 正确的模块导入、准确的 JID 到 folder 映射、无依赖的模块加载、以及清洁的类型系统
- **Preservation**: 必须保持不变的现有行为 - 所有现有测试通过、类型检查零错误、其他数据库操作正常、队列逻辑不变
- **getRouterState**: src/db.ts 中导出的函数，用于获取 group 的路由状态（最后处理的消息 ID）
- **chatJid**: 聊天会话的唯一标识符（如 WhatsApp 群组 ID）
- **groupFolder**: registered_groups 表中的 folder 字段，用于标识本地工作目录
- **chokidar**: 已从 package.json 中移除的文件监视库
- **ContainerConfig/MountConfig**: 已废弃的容器相关类型定义
- **activeContainers**: group-queue.ts 中的变量名，语义上应为 activeAgents

## Bug Details

### Bug Condition

系统存在 5 个独立的 Bug 条件，每个都会导致系统故障：

**B1 - 缺失导入错误:**
当 router.ts 执行到调用 getRouterState 函数的代码行时，JavaScript 运行时发现该标识符未定义，抛出 ReferenceError。

**B2 - 错误的标识符映射:**
当 index.ts 的 processGroup 函数接收到 chatJid 参数并直接将其作为 groupFolder 使用时，后续的数据库查询（getRegisteredGroupByFolder）无法找到对应的 group 记录，导致消息路由失败。

**B3 - 缺失依赖崩溃:**
当 Node.js 加载 src/ipc.ts 模块时，遇到 `import { watch } from 'chokidar'` 语句，由于 chokidar 已从 package.json 中移除，模块解析失败，进程崩溃。

**C5 - 架构残留污染:**
当开发者阅读或使用 types.ts、config.ts、db.ts 中的容器相关代码时，这些已废弃的定义与当前架构（已移除容器）产生语义冲突，造成混淆和潜在的错误使用。

**C7 - 语义过时变量名:**
当开发者阅读 group-queue.ts 中的 activeContainers 变量时，变量名暗示系统仍在使用容器架构，与实际的 Agent 架构不符，降低代码可读性。

**形式化规范:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SystemState
  OUTPUT: boolean
  
  RETURN (input.routerModule.imports NOT CONTAINS 'getRouterState')
         OR (input.indexModule.processGroup.parameter == 'chatJid' AND used_as 'groupFolder')
         OR (input.ipcModule.imports CONTAINS 'chokidar' AND chokidar NOT IN dependencies)
         OR (input.typesModule CONTAINS 'ContainerConfig' OR input.configModule CONTAINS 'CONTAINER_IMAGE')
         OR (input.groupQueueModule.variableNames CONTAINS 'activeContainers')
END FUNCTION
```

### Examples

**B1 示例:**
- 触发条件: router.ts 第 72 行执行 `const state = getRouterState(groupFolder);`
- 实际行为: `ReferenceError: getRouterState is not defined`
- 预期行为: 函数正常执行，返回 RouterState 对象或 null

**B2 示例:**
- 触发条件: index.ts 第 120 行 `const groupFolder = chatJid;`，然后传递给 processGroup
- 实际行为: getRegisteredGroupByFolder(chatJid) 返回 null，消息无法路由
- 预期行为: 通过 chatJid 查询 registered_groups 表，获取正确的 folder 字段

**B3 示例:**
- 触发条件: 系统启动时加载 src/ipc.ts
- 实际行为: `Error: Cannot find module 'chokidar'`，进程退出
- 预期行为: 模块正常加载，使用 Node.js 原生 API 实现文件监视

**C5 示例:**
- 触发条件: 开发者查看 types.ts 中的 RegisteredGroup 接口
- 实际行为: 看到 containerConfig?: ContainerConfig 字段，但容器已被移除
- 预期行为: 接口中不包含任何容器相关字段

**C7 示例:**
- 触发条件: 开发者阅读 group-queue.ts 的并发控制逻辑
- 实际行为: 看到 activeContainers 变量名，误以为系统仍在使用容器
- 预期行为: 变量名为 activeAgents，清晰反映当前架构

## Expected Behavior

### Preservation Requirements

**不变的行为:**
- 所有现有单元测试和集成测试必须继续通过
- TypeScript 类型检查必须零错误零警告
- router.ts 中其他已正确导入的函数（getRegisteredGroupByFolder、getMessagesSince 等）必须继续正常工作
- db.ts 中其他数据库操作（insertMessage、getUnprocessedMessages 等）必须继续正常工作
- group-queue.ts 的队列逻辑（串行化、并发限制、任务调度）必须保持完全相同的行为
- ipc.ts 中其他 IPC 功能（writeMessage、readMessage、getPendingMessages 等）必须继续正常工作

**作用域:**
所有不涉及以下内容的代码应完全不受影响：
- getRouterState 函数的导入和调用
- chatJid 到 groupFolder 的映射逻辑
- chokidar 的使用和文件监视实现
- ContainerConfig、MountConfig 类型的定义和使用
- activeContainers 变量的命名

## Hypothesized Root Cause

基于代码分析，5 个 Bug 的根本原因如下：

1. **B1 - 导入遗漏**: 在重构或合并代码时，开发者在 router.ts 中添加了对 getRouterState 的调用，但忘记在文件顶部的 import 语句中添加该函数。这是典型的重构疏忽。

2. **B2 - 概念混淆**: 开发者在 index.ts 的消息处理循环中，错误地将 chatJid（外部标识符）直接用作 groupFolder（内部标识符），没有意识到需要通过数据库查询进行映射。这反映了对系统架构的理解不足。

3. **B3 - 依赖清理不完整**: 在移除容器相关代码时，开发者从 package.json 中删除了 chokidar 依赖，但忘记更新 ipc.ts 中的 import 语句和相关实现。这是依赖管理的疏忽。

4. **C5 - 清理范围不足**: 在执行容器移除任务时，开发者主要关注了运行时代码（如 container.ts），但忽略了类型定义、配置常量、以及数据库 schema 中的容器残留。这是清理工作不彻底的结果。

5. **C7 - 重命名遗漏**: 在移除容器架构后，开发者更新了主要的概念和接口，但遗漏了 group-queue.ts 中的内部变量名。这是重构范围不完整的体现。

## Correctness Properties

Property 1: Bug Condition - 系统启动和运行时无错误

_For any_ 系统状态，当执行启动流程、消息路由、模块加载、类型检查时，修复后的系统 SHALL 不抛出 ReferenceError、不产生路由失败、不崩溃、不包含过时的类型定义、不使用语义混淆的变量名。

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - 现有功能完全保持

_For any_ 不涉及 5 个 Bug 修复点的代码路径和功能，修复后的系统 SHALL 产生与修复前完全相同的行为，保持所有测试通过、类型检查通过、数据库操作正常、队列逻辑不变。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

修复策略采用最小化改动原则，每个 Bug 独立修复，避免引入新的风险。

**B1 修复 - 添加缺失导入:**

**File**: `src/router.ts`

**Specific Changes**:
1. **添加导入**: 在第 1 行的 import 语句中，将 `getRouterState` 添加到从 './db.js' 导入的函数列表
   - 修改前: `import { getRegisteredGroupByFolder, getMessagesSince, setRouterState, insertMessage, markMessagesProcessed } from './db.js';`
   - 修改后: `import { getRegisteredGroupByFolder, getMessagesSince, setRouterState, getRouterState, insertMessage, markMessagesProcessed } from './db.js';`

**B2 修复 - 修正标识符映射:**

**File**: `src/index.ts`

**Specific Changes**:
1. **添加导入**: 在文件顶部添加 `getRegisteredGroup` 函数的导入
   - 在现有的 db.js 导入语句中添加 `getRegisteredGroup`
   
2. **修正映射逻辑**: 在 startMessageLoop 函数的消息分组循环中（约第 120 行），替换错误的直接赋值
   - 修改前:
     ```typescript
     for (const [chatJid, messages] of groupedMessages.entries()) {
       const groupFolder = chatJid; // Simplified for now
       await processGroup(groupFolder);
     }
     ```
   - 修改后:
     ```typescript
     for (const [chatJid, messages] of groupedMessages.entries()) {
       const group = getRegisteredGroup(chatJid);
       if (!group) {
         logger.warn(`No registered group found for chatJid: ${chatJid}`);
         markMessagesProcessed(messages.map(m => m.id));
         continue;
       }
       await processGroup(group.folder);
     }
     ```

**B3 修复 - 移除 chokidar 依赖:**

**File**: `src/ipc.ts`

**Specific Changes**:
1. **移除 chokidar 导入**: 删除第 3 行的 `import { watch } from 'chokidar';`

2. **简化 watchIPC 函数**: 由于 watchIPC 函数在当前代码中未被使用（index.ts 和其他模块都没有调用它），采用最简单的修复方案：
   - 保留函数签名以维持 API 兼容性
   - 函数体改为立即返回清理函数，并记录警告日志
   - 修改后:
     ```typescript
     export function watchIPC(
       onMessage: (message: IPCMessage) => void,
       onTaskResult: (task: IPCTask) => void
     ): () => void {
       ensureIpcDirs();
       logger.warn('IPC watcher is not implemented after chokidar removal. Use pollIPC instead.');
       
       // Return no-op cleanup function
       return () => {
         logger.info('IPC watcher stopped (no-op)');
       };
     }
     ```

3. **注释说明**: 在函数上方添加注释，说明当前实现状态和替代方案

**C5 修复 - 清理容器残留:**

**File 1**: `src/types.ts`

**Specific Changes**:
1. **删除类型定义**: 删除 ContainerConfig 和 MountConfig 接口定义（约第 60-75 行）
2. **删除字段引用**: 在 RegisteredGroup 接口中删除 `containerConfig?: ContainerConfig;` 字段

**File 2**: `src/config.ts`

**Specific Changes**:
1. **删除常量**: 删除以下容器相关常量定义（约第 14-16 行）:
   - `export const CONTAINER_IMAGE = ...`
   - `export const CONTAINER_TIMEOUT = ...`
   - `export const IDLE_TIMEOUT = ...`

2. **保留常量**: 保留 `MAX_CONCURRENT_CONTAINERS` 常量（虽然名称过时，但在 C7 修复中会处理，此处保持不变以避免跨文件依赖）

**File 3**: `src/db.ts`

**Specific Changes**:
1. **删除 schema 字段**: 在 initializeDatabase 函数的 CREATE TABLE registered_groups 语句中，删除 `container_config TEXT` 字段（约第 40 行）

2. **删除字段处理**: 在 setRegisteredGroup、getRegisteredGroup、getRegisteredGroupByFolder、getAllRegisteredGroups、getMainGroup 函数中，删除所有与 container_config 相关的代码：
   - 删除 INSERT 语句中的 container_config 列
   - 删除 JSON.stringify(group.containerConfig) 的处理
   - 删除 SELECT 结果中的 container_config 解析
   - 删除返回对象中的 container_config 字段

**C7 修复 - 重命名语义过时变量:**

**File**: `src/group-queue.ts`

**Specific Changes**:
1. **重命名变量**: 将 `activeContainers` 重命名为 `activeAgents`（3 处）:
   - 第 18 行: 类成员声明
   - 第 45 行: 并发限制检查
   - 第 56 行: 增量操作
   - 第 68 行: 减量操作
   - 第 93 行: getStats 返回对象

2. **重命名返回字段**: 在 getStats 方法的返回类型中，将 `activeContainers` 字段重命名为 `activeAgents`

3. **更新日志消息**: 更新第 46 行的日志消息，将 "Concurrency limit reached" 中的上下文从容器改为 Agent

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先在未修复代码上运行探索性测试以确认 Bug 存在，然后在修复后验证 Bug 已解决且无回归。

### Exploratory Bug Condition Checking

**Goal**: 在实施修复前，通过测试确认 5 个 Bug 的存在，验证根本原因分析的正确性。

**Test Plan**: 编写针对性测试用例，在未修复代码上运行，预期观察到失败。这些测试将作为修复验证的基准。

**Test Cases**:
1. **B1 导入错误测试**: 尝试导入并调用 router.ts 模块（将在未修复代码上失败，抛出 ReferenceError）
2. **B2 路由失败测试**: 模拟消息处理流程，使用真实的 chatJid，验证是否能正确路由到 groupFolder（将在未修复代码上失败，返回 null）
3. **B3 模块加载测试**: 尝试导入 ipc.ts 模块（将在未修复代码上失败，抛出 MODULE_NOT_FOUND）
4. **C5 类型污染测试**: 运行 TypeScript 编译器，检查是否存在未使用的类型定义（将在未修复代码上发现 ContainerConfig 等类型）
5. **C7 语义测试**: 代码审查 group-queue.ts，检查变量命名是否符合当前架构（将在未修复代码上发现 activeContainers）

**Expected Counterexamples**:
- B1: `ReferenceError: getRouterState is not defined` at router.ts:72
- B2: `getRegisteredGroupByFolder(chatJid)` returns null, message routing fails
- B3: `Error: Cannot find module 'chokidar'` when importing ipc.ts
- C5: TypeScript 编译通过但存在未使用的容器类型定义
- C7: 变量名 activeContainers 与当前架构不符

### Fix Checking

**Goal**: 验证修复后，所有 Bug 条件下的行为都符合预期。

**Pseudocode:**
```
FOR ALL bugCondition IN [B1, B2, B3, C5, C7] DO
  result := executeFixedCode(bugCondition)
  ASSERT expectedBehavior(result)
END FOR
```

**具体验证:**
- B1: router.ts 成功导入 getRouterState，调用时返回正确的 RouterState 对象
- B2: index.ts 通过 chatJid 正确查询到 groupFolder，消息成功路由
- B3: ipc.ts 模块成功加载，watchIPC 函数返回清理函数（即使是 no-op）
- C5: TypeScript 编译通过，不存在容器相关类型定义，数据库 schema 不包含 container_config 字段
- C7: group-queue.ts 中所有变量名使用 activeAgents，语义清晰

### Preservation Checking

**Goal**: 验证修复后，所有不涉及 Bug 修复点的功能保持完全相同的行为。

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT fixedSystem(input) = originalSystem(input)
END FOR
```

**Testing Approach**: 使用现有的测试套件作为回归测试基准。由于修复采用最小化改动原则，预期所有现有测试应继续通过。

**Test Plan**: 
1. 运行完整的测试套件 `npm test`，验证所有测试通过
2. 运行类型检查 `npm run typecheck`，验证零错误
3. 手动验证关键功能：消息存储、数据库查询、队列调度

**Test Cases**:
1. **消息处理保持**: 验证 insertMessage、getUnprocessedMessages、markMessagesProcessed 等函数继续正常工作
2. **路由功能保持**: 验证 formatMessages、shouldTrigger、findChannelForJid 等函数继续正常工作
3. **队列逻辑保持**: 验证 GroupQueue 的 enqueue、processQueue、getStats 等方法的行为完全不变
4. **IPC 功能保持**: 验证 writeMessage、readMessage、getPendingMessages 等函数继续正常工作
5. **数据库操作保持**: 验证 getRegisteredGroup、getAllRegisteredGroups、setSession 等函数继续正常工作

### Unit Tests

- 测试 router.ts 的 getRouterState 导入和调用
- 测试 index.ts 的 chatJid 到 groupFolder 映射逻辑
- 测试 ipc.ts 的模块加载和 watchIPC 函数
- 测试 types.ts 的类型定义完整性（不包含容器类型）
- 测试 group-queue.ts 的变量命名和队列逻辑

### Property-Based Tests

- 生成随机的 chatJid 和 groupFolder 组合，验证映射逻辑的正确性
- 生成随机的消息序列，验证路由和处理逻辑的保持性
- 生成随机的队列任务，验证并发控制逻辑的保持性

### Integration Tests

- 测试完整的消息流：从接收到存储到路由到处理
- 测试系统启动流程：模块加载、数据库初始化、通道连接
- 测试跨模块交互：router.ts 调用 db.ts、index.ts 调用 router.ts 和 db.ts
