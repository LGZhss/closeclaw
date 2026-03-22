# Implementation Plan

## Bug B1: 缺失导入错误修复

- [ ] 1. Write bug condition exploration test for B1
  - **Property 1: Bug Condition** - getRouterState 导入缺失导致 ReferenceError
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that router.ts can successfully import and call getRouterState function
  - Verify that calling getRouterState with a valid groupFolder returns RouterState or null (not ReferenceError)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with ReferenceError: getRouterState is not defined
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1_

- [ ] 2. Write preservation property tests for B1 (BEFORE implementing fix)
  - **Property 2: Preservation** - 其他已正确导入的函数继续正常工作
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for other imported functions from db.js
  - Test that getRegisteredGroupByFolder, getMessagesSince, setRouterState, insertMessage, markMessagesProcessed continue to work
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.3_

- [ ] 3. Fix for B1 - 添加缺失的 getRouterState 导入

  - [ ] 3.1 Implement the fix
    - 在 src/router.ts 第 1 行的 import 语句中添加 getRouterState
    - 修改: `import { getRegisteredGroupByFolder, getMessagesSince, setRouterState, getRouterState, insertMessage, markMessagesProcessed } from './db.js';`
    - _Bug_Condition: router.ts 调用 getRouterState 但未导入该函数_
    - _Expected_Behavior: getRouterState 正确导入并可调用_
    - _Preservation: 其他已导入函数继续正常工作_
    - _Requirements: 1.1, 2.1, 3.3_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - getRouterState 导入成功
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - 其他函数继续正常工作
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug B2: 错误的标识符映射修复

- [ ] 4. Write bug condition exploration test for B2
  - **Property 1: Bug Condition** - chatJid 直接用作 groupFolder 导致路由失败
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that processGroup receives correct groupFolder (not chatJid) when processing messages
  - Create test database with registered group having chatJid and folder fields
  - Simulate message processing loop with chatJid, verify groupFolder is correctly resolved
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (groupFolder equals chatJid instead of correct folder value)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.2, 2.2_

- [ ] 5. Write preservation property tests for B2 (BEFORE implementing fix)
  - **Property 2: Preservation** - 其他数据库操作继续正常工作
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for other database operations
  - Test that insertMessage, getUnprocessedMessages, markMessagesProcessed continue to work
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.4_

- [ ] 6. Fix for B2 - 修正 chatJid 到 groupFolder 的映射逻辑

  - [ ] 6.1 Implement the fix
    - 在 src/index.ts 顶部添加 getRegisteredGroup 函数导入
    - 在 startMessageLoop 函数的消息分组循环中（约第 120 行）修正映射逻辑
    - 使用 getRegisteredGroup(chatJid) 查询 group，获取 group.folder
    - 添加错误处理：如果 group 不存在，记录警告并标记消息为已处理
    - _Bug_Condition: chatJid 直接用作 groupFolder，导致数据库查询失败_
    - _Expected_Behavior: 通过 chatJid 查询获取正确的 groupFolder_
    - _Preservation: 其他数据库操作继续正常工作_
    - _Requirements: 1.2, 2.2, 3.4_

  - [ ] 6.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - chatJid 正确映射到 groupFolder
    - **IMPORTANT**: Re-run the SAME test from task 4 - do NOT write a new test
    - The test from task 4 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 4
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.2_

  - [ ] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - 其他数据库操作继续正常工作
    - **IMPORTANT**: Re-run the SAME tests from task 5 - do NOT write new tests
    - Run preservation property tests from step 5
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug B3: 缺失依赖崩溃修复

- [ ] 7. Write bug condition exploration test for B3
  - **Property 1: Bug Condition** - chokidar 导入导致模块加载崩溃
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that src/ipc.ts module can be successfully imported without errors
  - Verify that watchIPC function exists and returns a cleanup function
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with Error: Cannot find module 'chokidar'
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3, 2.3_

- [ ] 8. Write preservation property tests for B3 (BEFORE implementing fix)
  - **Property 2: Preservation** - 其他 IPC 功能继续正常工作
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for other IPC functions (if module can be loaded in isolation)
  - Test that writeMessage, readMessage, getPendingMessages continue to work
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Note: If module cannot be loaded due to chokidar, document expected behavior based on code analysis
  - Run tests on UNFIXED code (or document expected behavior)
  - **EXPECTED OUTCOME**: Tests PASS or behavior documented (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.7_

- [ ] 9. Fix for B3 - 移除 chokidar 依赖并简化 watchIPC

  - [ ] 9.1 Implement the fix
    - 在 src/ipc.ts 中删除 `import { watch } from 'chokidar';` 语句
    - 简化 watchIPC 函数为 no-op 实现（保留 API 兼容性）
    - 函数体改为立即返回清理函数，并记录警告日志
    - 添加注释说明当前实现状态和替代方案（使用 pollIPC）
    - _Bug_Condition: ipc.ts 导入已移除的 chokidar 依赖_
    - _Expected_Behavior: 模块成功加载，watchIPC 返回清理函数_
    - _Preservation: 其他 IPC 功能继续正常工作_
    - _Requirements: 1.3, 2.3, 3.7_

  - [ ] 9.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - ipc.ts 模块成功加载
    - **IMPORTANT**: Re-run the SAME test from task 7 - do NOT write a new test
    - The test from task 7 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 7
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.3_

  - [ ] 9.3 Verify preservation tests still pass
    - **Property 2: Preservation** - 其他 IPC 功能继续正常工作
    - **IMPORTANT**: Re-run the SAME tests from task 8 - do NOT write new tests
    - Run preservation property tests from step 8
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug C5: 架构残留污染清理

- [ ] 10. Write bug condition exploration test for C5
  - **Property 1: Bug Condition** - 容器相关类型和配置仍然存在
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that types.ts does not contain ContainerConfig or MountConfig type definitions
  - Test that config.ts does not contain CONTAINER_IMAGE, CONTAINER_TIMEOUT, IDLE_TIMEOUT constants
  - Test that db.ts schema does not contain container_config field in registered_groups table
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (finds container-related definitions)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4, 2.4_

- [ ] 11. Write preservation property tests for C5 (BEFORE implementing fix)
  - **Property 2: Preservation** - 其他类型定义和配置继续正常工作
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for other type definitions and configurations
  - Test that RegisteredGroup interface (without containerConfig), other types, and MAX_CONCURRENT_CONTAINERS constant continue to work
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.6_

- [ ] 12. Fix for C5 - 清理容器相关类型和配置

  - [ ] 12.1 Implement the fix
    - 在 src/types.ts 中删除 ContainerConfig 和 MountConfig 接口定义
    - 在 RegisteredGroup 接口中删除 containerConfig 字段
    - 在 src/config.ts 中删除 CONTAINER_IMAGE, CONTAINER_TIMEOUT, IDLE_TIMEOUT 常量
    - 在 src/db.ts 的 initializeDatabase 函数中删除 container_config 字段
    - 在 db.ts 的所有函数中删除 container_config 相关代码（INSERT、SELECT、JSON 处理）
    - _Bug_Condition: 容器相关类型和配置仍然存在于代码中_
    - _Expected_Behavior: 所有容器相关定义被完全移除_
    - _Preservation: 其他类型定义和配置继续正常工作_
    - _Requirements: 1.4, 2.4, 3.6_

  - [ ] 12.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - 容器相关定义完全移除
    - **IMPORTANT**: Re-run the SAME test from task 10 - do NOT write a new test
    - The test from task 10 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 10
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.4_

  - [ ] 12.3 Verify preservation tests still pass
    - **Property 2: Preservation** - 其他类型定义和配置继续正常工作
    - **IMPORTANT**: Re-run the SAME tests from task 11 - do NOT write new tests
    - Run preservation property tests from step 11
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug C7: 语义过时变量名修复

- [ ] 13. Write bug condition exploration test for C7
  - **Property 1: Bug Condition** - activeContainers 变量名与当前架构不符
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that group-queue.ts uses activeAgents variable name (not activeContainers)
  - Test that getStats method returns activeAgents field (not activeContainers)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (finds activeContainers variable name)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.5, 2.5_

- [ ] 14. Write preservation property tests for C7 (BEFORE implementing fix)
  - **Property 2: Preservation** - 队列逻辑行为保持不变
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for queue logic
  - Test that enqueue, processQueue, concurrency control, and task scheduling continue to work identically
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.5_

- [ ] 15. Fix for C7 - 重命名 activeContainers 为 activeAgents

  - [ ] 15.1 Implement the fix
    - 在 src/group-queue.ts 中将所有 activeContainers 重命名为 activeAgents
    - 更新类成员声明、并发限制检查、增量/减量操作、getStats 返回对象
    - 更新日志消息中的上下文描述
    - _Bug_Condition: activeContainers 变量名与当前架构（Agent）不符_
    - _Expected_Behavior: 变量名改为 activeAgents，语义清晰_
    - _Preservation: 队列逻辑行为保持完全不变_
    - _Requirements: 1.5, 2.5, 3.5_

  - [ ] 15.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - activeAgents 变量名正确
    - **IMPORTANT**: Re-run the SAME test from task 13 - do NOT write a new test
    - The test from task 13 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 13
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.5_

  - [ ] 15.3 Verify preservation tests still pass
    - **Property 2: Preservation** - 队列逻辑行为保持不变
    - **IMPORTANT**: Re-run the SAME tests from task 14 - do NOT write new tests
    - Run preservation property tests from step 14
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Final Checkpoint

- [ ] 16. Checkpoint - Ensure all tests pass
  - Run complete test suite: npm test
  - Run type checking: npm run typecheck
  - Verify all 5 bugs are fixed and no regressions introduced
  - Ask the user if questions arise
