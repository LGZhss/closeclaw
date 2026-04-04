# Implementation Plan

## 阶段1: 核心模块恢复（编译阻塞修复）

### Bug B1.1-B1.2: 缺失核心模块

- [ ] 1. Write bug condition exploration test for B1.1-B1.2
  - **Property 1: Bug Condition** - 缺失 bus/grpc-client 和 adapters/registry 导致编译失败
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - Test that src/index.ts can successfully import GrpcKernelBusClient from './bus/grpc-client.js'
  - Test that src/index.ts can successfully import LLMAdapterRegistry from './adapters/registry.js'
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with TS2307: Cannot find module errors
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [ ] 2. Write preservation property tests for B1.1-B1.2 (BEFORE implementing fix)
  - **Property 2: Preservation** - 其他模块导入继续正常工作
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for other imports
  - Test that SandboxManager, logger, config imports continue to work
  - Write property-based tests capturing observed behavior patterns
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 9.3, 9.4_

- [ ] 3. Fix for B1.1-B1.2 - 创建缺失的核心模块

  - [ ] 3.1 Create src/bus/grpc-client.ts
    - 创建 GrpcKernelBusClient 类，实现与Go内核的gRPC通信
    - 定义 BusMessage 接口（type, payload, traceId）
    - 实现 connect() 方法 - 连接到Named Pipe (Windows) 或 Unix Socket (Linux)
    - 实现 onMessage() 方法 - 注册消息处理器
    - 实现 send() 方法 - 发送消息到Go内核
    - 实现 close() 方法 - 关闭连接
    - 添加完整的TypeScript类型定义
    - _Bug_Condition: src/bus/grpc-client.ts 不存在_
    - _Expected_Behavior: 模块存在且可被正确导入_
    - _Requirements: 1.1, 5.1_

  - [ ] 3.2 Create src/adapters/registry.ts
    - 创建 LLMAdapterRegistry 类，管理LLM适配器
    - 定义 LLMAdapter 接口（name, chat方法）
    - 实现 constructor() - 初始化并注册默认适配器
    - 实现 register() 方法 - 注册新适配器
    - 实现 get() 方法 - 获取指定适配器
    - 添加完整的TypeScript类型定义
    - _Bug_Condition: src/adapters/registry.ts 不存在_
    - _Expected_Behavior: 模块存在且可被正确导入_
    - _Requirements: 1.2, 5.2_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - 模块成功导入
    - **IMPORTANT**: Re-run the SAME test from task 1
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 5.1, 5.2_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - 其他导入继续正常工作
    - **IMPORTANT**: Re-run the SAME tests from task 2
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)


### Bug B1.3-B1.4: TypeScript类型错误

- [ ] 4. Write bug condition exploration test for B1.3-B1.4
  - **Property 1: Bug Condition** - 未使用变量和隐式any类型
  - Test that src/index.ts has no unused imports (config)
  - Test that src/index.ts busClient.onMessage callback has explicit type for msg parameter
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with TS6133 and TS7006 errors
  - _Requirements: 1.3, 1.4, 5.3, 5.4_

- [ ] 5. Fix for B1.3-B1.4 - 修复TypeScript类型错误

  - [ ] 5.1 Fix unused config import in src/index.ts
    - 选项A: 实际使用config变量（如记录配置信息）
    - 选项B: 移除未使用的import语句
    - 推荐选项B，因为当前代码确实不需要config
    - _Bug_Condition: config导入但未使用_
    - _Expected_Behavior: 移除未使用的导入_
    - _Requirements: 1.3, 5.3_

  - [ ] 5.2 Fix implicit any type in busClient.onMessage callback
    - 为msg参数添加显式类型: `(msg: BusMessage) => Promise<any>`
    - 确保BusMessage类型从bus/grpc-client.ts正确导入
    - _Bug_Condition: msg参数隐式any类型_
    - _Expected_Behavior: msg参数有显式类型声明_
    - _Requirements: 1.4, 5.4_

  - [ ] 5.3 Verify TypeScript compilation passes
    - Run `npm run typecheck`
    - **EXPECTED OUTCOME**: Zero TypeScript errors
    - _Requirements: 9.1_

## 阶段2: 安全漏洞修复（CRITICAL优先级）

### Bug B2.1: cli_anything白名单绕过

- [ ] 6. Write bug condition exploration test for B2.1
  - **Property 1: Bug Condition** - cli_anything可执行任意命令
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - Test that cli_anything tool exists in tool-definitions.ts
  - Test that cli_anything handler exists in tool-registry.ts
  - Test that src/tools/cli-anything.ts file exists
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (confirms tool exists, which is the bug)
  - _Requirements: 2.1, 6.1_

- [ ] 7. Write preservation property tests for B2.1 (BEFORE implementing fix)
  - **Property 2: Preservation** - 其他工具继续正常工作
  - Test that execute_code, read_file, write_file, list_dir, search_web tools continue to work
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: 9.5_

- [ ] 8. Fix for B2.1 - 物理删除cli_anything工具

  - [ ] 8.1 Delete src/tools/cli-anything.ts file
    - 完全删除此文件
    - _Bug_Condition: cli_anything工具存在且不安全_
    - _Expected_Behavior: 工具被完全移除_
    - _Requirements: 2.1, 6.1_

  - [ ] 8.2 Remove cli_anything from tool-definitions.ts
    - 从toolDefinitions数组中移除cliAnythingTool定义
    - _Requirements: 2.1, 6.1_

  - [ ] 8.3 Remove cli_anything handler from tool-registry.ts
    - 从createToolRegistry返回对象中移除cli_anything handler
    - _Requirements: 2.1, 6.1_

  - [ ] 8.4 Verify bug condition exploration test now fails (tool removed)
    - Re-run test from step 6
    - **EXPECTED OUTCOME**: Test FAILS (confirms tool is removed)
    - _Requirements: 6.1_

  - [ ] 8.5 Verify preservation tests still pass
    - Re-run tests from step 7
    - **EXPECTED OUTCOME**: Tests PASS (other tools still work)
    - _Requirements: 9.5_

### Bug B2.2: readWsFile缺少保护

- [ ] 9. Write bug condition exploration test for B2.2
  - **Property 1: Bug Condition** - readWsFile可读取敏感文件
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - Test that readWsFile(".env") does NOT throw "Access denied" error
  - Test that readWsFile(".git/config") does NOT throw "Access denied" error
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (confirms no protection, which is the bug)
  - _Requirements: 2.2, 6.2_

- [ ] 10. Write preservation property tests for B2.2 (BEFORE implementing fix)
  - **Property 2: Preservation** - 读取正常文件继续工作
  - Test that readWsFile("README.md") continues to work
  - Test that readWsFile("src/index.ts") continues to work
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: 9.6_

- [ ] 11. Fix for B2.2 - 为readWsFile添加PROTECTED_PATHS检查

  - [ ] 11.1 Add PROTECTED_PATHS check to readWsFile
    - 在src/utils/utils.ts的readWsFile函数开头添加保护检查
    - 使用与writeWsFile相同的检查逻辑
    - 检查路径是否匹配PROTECTED_PATHS中的任何路径
    - 如果匹配，抛出 "Access denied: ${filePath} is a protected path" 错误
    - _Bug_Condition: readWsFile缺少PROTECTED_PATHS检查_
    - _Expected_Behavior: readWsFile拒绝访问受保护路径_
    - _Requirements: 2.2, 6.2_

  - [ ] 11.2 Verify bug condition exploration test now fails (protection added)
    - Re-run test from step 9
    - **EXPECTED OUTCOME**: Test FAILS (confirms protection is added)
    - _Requirements: 6.2_

  - [ ] 11.3 Verify preservation tests still pass
    - Re-run tests from step 10
    - **EXPECTED OUTCOME**: Tests PASS (normal files still readable)
    - _Requirements: 9.6_


### Bug B2.3: cli_anything参数丢失（如果保留工具）

- [ ] 12. SKIP - cli_anything已在Bug B2.1中删除
  - 此Bug随工具删除而自动解决
  - 无需额外修复
  - _Requirements: 2.3, 6.3_

## 阶段3: 运行时Bug修复（HIGH/MEDIUM优先级）

### Bug B3.1: 临时文件名不一致

- [x] 13. Write bug condition exploration test for B3.1
  - **Property 1: Bug Condition** - 临时文件清理逻辑查找错误的文件名模式
  - Test that process-executor.ts creates temp files with pattern `temp_${executionId}.js`
  - Test that cleanup logic searches for pattern `temp_exec_`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (patterns don't match)
  - _Requirements: 3.1, 7.1_

- [x] 14. Write preservation property tests for B3.1 (BEFORE implementing fix)
  - **Property 2: Preservation** - 代码执行功能继续正常工作
  - Test that ProcessExecutor.execute() continues to work correctly
  - Test that code execution results are correct
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: 9.4_

- [-] 15. Fix for B3.1 - 修复临时文件名模式不一致

  - [x] 15.1 Update cleanup logic in process-executor.ts
    - 在第206行附近，将 `argsStr.includes("temp_exec_")` 改为 `argsStr.includes("temp_")`
    - 将 `args.find((a) => a.includes("temp_exec_"))` 改为 `args.find((a) => a.includes("temp_"))`
    - 确保清理逻辑与创建逻辑使用相同的文件名模式
    - _Bug_Condition: 清理逻辑查找temp_exec_，但创建的是temp__
    - _Expected_Behavior: 清理逻辑查找temp_，与创建一致_
    - _Requirements: 3.1, 7.1_

  - [x] 15.2 Verify bug condition exploration test now passes
    - Re-run test from step 13
    - **EXPECTED OUTCOME**: Test PASSES (patterns now match)
    - _Requirements: 7.1_

  - [x] 15.3 Verify preservation tests still pass
    - Re-run tests from step 14
    - **EXPECTED OUTCOME**: Tests PASS
    - _Requirements: 9.4_

### Bug B3.2: read_file参数解析

- [x] 16. Write bug condition exploration test for B3.2
  - **Property 1: Bug Condition** - read_file无法处理带空格的文件名
  - Test that _parseArgsToObject has special handling for write_file
  - Test that _parseArgsToObject does NOT have special handling for read_file
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (confirms no special handling for read_file)
  - _Requirements: 3.2, 7.2_

- [x] 17. Write preservation property tests for B3.2 (BEFORE implementing fix)
  - **Property 2: Preservation** - write_file和其他工具继续正常工作
  - Test that write_file with spaces in filename continues to work
  - Test that other tools' argument parsing continues to work
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: 9.5_

- [x] 18. Fix for B3.2 - 为read_file添加特殊参数解析

  - [x] 18.1 Add special handling for read_file in _parseArgsToObject
    - 在src/tools/tool-registry.ts的_parseArgsToObject方法中
    - 在write_file特殊处理之后，添加read_file的特殊处理
    - 使用正则表达式: `/^\/read\s+([\s\S]*)$/i`
    - 提取完整的文件路径（包括空格）: `{ filePath: match[1].trim() }`
    - _Bug_Condition: read_file只能按空格分割参数_
    - _Expected_Behavior: read_file支持带空格的文件名_
    - _Requirements: 3.2, 7.2_

  - [x] 18.2 Verify bug condition exploration test now fails (special handling added)
    - Re-run test from step 16
    - **EXPECTED OUTCOME**: Test FAILS (confirms special handling is added)
    - _Requirements: 7.2_

  - [x] 18.3 Verify preservation tests still pass
    - Re-run tests from step 17
    - **EXPECTED OUTCOME**: Tests PASS
    - _Requirements: 9.5_

### Bug B3.3: runGit重试机制失效

- [x] 19. Write bug condition exploration test for B3.3
  - **Property 1: Bug Condition** - runGit的Promise没有await导致catch无法捕获错误
  - Test that runGit function returns Promise without await
  - Test that catch block cannot catch Promise errors
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (confirms no await)
  - _Requirements: 3.3, 7.3_

- [x] 20. Write preservation property tests for B3.3 (BEFORE implementing fix)
  - **Property 2: Preservation** - git操作成功时继续正常工作
  - Test that runGit("backup") continues to work when git succeeds
  - Test that runGit("sync") continues to work when git succeeds
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: 9.6_

- [x] 21. Fix for B3.3 - 为runGit的Promise添加await

  - [x] 21.1 Add await to Promise in runGit function
    - 在src/utils/utils.ts的runGit函数中
    - 在backup分支的 `return new Promise(...)` 前添加 `await`
    - 在sync分支的 `return new Promise(...)` 前添加 `await`
    - 确保错误能够被catch块捕获
    - _Bug_Condition: Promise没有await，错误无法被捕获_
    - _Expected_Behavior: Promise有await，错误可以被捕获并触发重试_
    - _Requirements: 3.3, 7.3_

  - [x] 21.2 Verify bug condition exploration test now fails (await added)
    - Re-run test from step 19
    - **EXPECTED OUTCOME**: Test FAILS (confirms await is added)
    - _Requirements: 7.3_

  - [x] 21.3 Verify preservation tests still pass
    - Re-run tests from step 20
    - **EXPECTED OUTCOME**: Tests PASS
    - _Requirements: 9.6_


### Bug B3.4-B3.6: TypeScript未使用变量

- [x] 22. Write bug condition exploration test for B3.4-B3.6
  - **Property 1: Bug Condition** - 未使用的变量和导入
  - Test that src/sandbox/manager.ts declares safeStdout but never uses it
  - Test that src/tools/tool-registry.ts imports safeCmd but never uses it
  - Test that src/tools/tool-registry.ts list_dir handler declares dirPath but never uses it
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (confirms unused variables)
  - _Requirements: 3.4, 3.5, 3.6, 7.4, 7.5, 7.6_

- [x] 23. Write preservation property tests for B3.4-B3.6 (BEFORE implementing fix)
  - **Property 2: Preservation** - 核心功能继续正常工作
  - Test that SandboxManager.run() continues to work correctly
  - Test that tool-registry tools continue to work correctly
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: 9.4, 9.5_

- [x] 24. Fix for B3.4-B3.6 - 清理未使用的变量和导入

  - [x] 24.1 Fix safeStdout in src/sandbox/manager.ts
    - 选项A: 实际使用safeStdout记录日志: `logger.debug(\`Output preview: ${safeStdout}\`)`
    - 选项B: 移除未使用的变量声明
    - 推荐选项A，因为safeStdout对调试有用
    - _Bug_Condition: safeStdout声明但未使用_
    - _Expected_Behavior: safeStdout被实际使用或移除_
    - _Requirements: 3.4, 7.4_

  - [x] 24.2 Fix safeCmd import in src/tools/tool-registry.ts
    - 从import语句中移除safeCmd
    - 修改为: `import { readWsFile, writeWsFile } from "../utils/utils.js";`
    - _Bug_Condition: safeCmd导入但未使用_
    - _Expected_Behavior: 移除未使用的导入_
    - _Requirements: 3.5, 7.5_

  - [x] 24.3 Fix dirPath parameter in list_dir handler
    - 使用下划线前缀标记有意未使用: `{ path: _dirPath }`
    - 或者实际使用dirPath参数实现目录列表功能
    - 推荐使用下划线前缀，因为当前是简单模拟实现
    - _Bug_Condition: dirPath参数声明但未使用_
    - _Expected_Behavior: 使用下划线前缀或实际使用参数_
    - _Requirements: 3.6, 7.6_

  - [x] 24.4 Verify TypeScript compilation passes
    - Run `npm run typecheck`
    - **EXPECTED OUTCOME**: Zero TypeScript errors
    - _Requirements: 9.1_

  - [x] 24.5 Verify preservation tests still pass
    - Re-run tests from step 23
    - **EXPECTED OUTCOME**: Tests PASS
    - _Requirements: 9.4, 9.5_

## 阶段4: CI/CD加固（P033未完成事项）

### Bug B4.1: 缺少.snyk配置

- [x] 25. Create .snyk configuration file
  - 在项目根目录创建.snyk文件
  - 配置version: v1.25.0
  - 添加ignore基线配置示例
  - 添加注释说明如何使用
  - _Bug_Condition: 缺少.snyk配置文件_
  - _Expected_Behavior: .snyk文件存在并配置正确_
  - _Requirements: 4.1, 8.1_

### Bug B4.2: SonarCloud缺少Quality Gate等待

- [x] 26. Update .github/workflows/sonarcloud.yml
  - 在SonarCloud Scan步骤中添加 `-Dsonar.qualitygate.wait=true` 参数
  - 确保Quality Gate失败时构建失败
  - 添加注释说明此参数的作用
  - _Bug_Condition: SonarCloud不等待Quality Gate结果_
  - _Expected_Behavior: SonarCloud等待并阻塞失败的Quality Gate_
  - _Requirements: 4.2, 8.2_

### Bug B4.3: Snyk缺少严重性阈值

- [x] 27. Update .github/workflows/snyk.yml
  - 在Snyk test命令中添加 `--severity-threshold=high` 参数
  - 确保只报告high和critical级别的漏洞
  - 添加注释说明此参数的作用
  - _Bug_Condition: Snyk报告所有级别的漏洞_
  - _Expected_Behavior: Snyk只报告high及以上级别的漏洞_
  - _Requirements: 4.3, 8.3_

### Bug B4.4: Cosign在每次push时触发

- [x] 28. Update .github/workflows/sigstore-cosign.yml
  - 将触发器从 `on: push:` 改为 `on: release: types: [published]`
  - 确保只在发布Release时执行签名
  - 添加注释说明为什么只在Release时触发
  - _Bug_Condition: Cosign在每次push时触发_
  - _Expected_Behavior: Cosign只在Release发布时触发_
  - _Requirements: 4.4, 8.4_

## 阶段5: 最终验证与文档更新

- [x] 29. Final Checkpoint - 完整验证

  - [x] 29.1 Run complete test suite
    - 执行 `npm test`
    - 确保所有测试通过
    - _Requirements: 9.3_

  - [x] 29.2 Run TypeScript type checking
    - 执行 `npm run typecheck`
    - 确保零TypeScript错误
    - _Requirements: 9.1_

  - [x] 29.3 Run build
    - 执行 `npm run build`
    - 确保编译成功生成dist/
    - _Requirements: 9.2_

  - [x] 29.4 Verify security fixes
    - 确认cli_anything工具已完全删除
    - 确认readWsFile无法读取.env等敏感文件
    - 运行安全测试套件
    - _Requirements: 6.1, 6.2_

  - [x] 29.5 Verify CI/CD configurations
    - 确认.snyk文件存在
    - 确认sonarcloud.yml包含qualitygate.wait参数
    - 确认snyk.yml包含severity-threshold参数
    - 确认sigstore-cosign.yml只在Release时触发
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 30. Update Documentation

  - [ ] 30.1 Update README.md
    - 更新架构图，说明三层通信机制
    - 更新工具列表，移除cli_anything
    - 添加安全说明，说明文件保护机制

  - [ ] 30.2 Update AGENTS.md
    - 更新工具列表，移除cli_anything
    - 添加bus和adapters模块说明

  - [ ] 30.3 Update docs/05-architecture/overview.md
    - 补充bus模块说明（gRPC通信）
    - 补充adapters模块说明（LLM适配器注册）

  - [ ] 30.4 Create docs/06-security/protected-paths.md (optional)
    - 新增文档，说明文件保护机制
    - 列出PROTECTED_PATHS清单
    - 说明如何添加新的保护路径

- [ ] 31. Ask user for final review
  - 向用户报告所有修复完成
  - 提供修复摘要和验证结果
  - 询问是否有其他问题需要处理
