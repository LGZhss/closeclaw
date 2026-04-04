# Bugfix Requirements Document

## Introduction

Governance Build Reconstruction & Hardening - 综合修复提案P031（6个变体）+ 核心文件恢复 + TypeScript严格合规 + P033未完成事项。当前代码库存在多个关键问题：缺失核心模块导致编译失败、多个安全漏洞（cli_anything白名单绕过、readWsFile缺少保护）、功能Bug（参数丢失、临时文件清理失败）、以及CI/CD加固未完成。本次修复确保系统可以通过TypeScript编译、消除安全漏洞、修复运行时Bug，并完成治理加固。

## Bug Analysis

### Current Behavior (Defect)

#### 模块缺失类（编译阻塞）

1.1 WHEN src/index.ts 导入 './bus/grpc-client.js' 时 THEN 系统抛出 TS2307: Cannot find module './bus/grpc-client.js'

1.2 WHEN src/index.ts 导入 './adapters/registry.js' 时 THEN 系统抛出 TS2307: Cannot find module './adapters/registry.js'

1.3 WHEN src/index.ts 第10行声明 config 变量时 THEN 系统抛出 TS6133: 'config' is declared but its value is never read

1.4 WHEN src/index.ts 第36行 busClient.onMessage 回调函数接收 msg 参数时 THEN 系统抛出 TS7006: Parameter 'msg' implicitly has an 'any' type

#### 安全漏洞类（CRITICAL）

2.1 WHEN 用户通过Telegram发送 `/cli cat .env` 命令时 THEN cli_anything工具的白名单检查被绕过，直接执行 `cat .env` 并返回所有API密钥

2.2 WHEN 用户通过Telegram发送 `/read .env` 命令时 THEN readWsFile函数缺少PROTECTED_PATHS检查，直接读取.env文件内容并返回所有敏感凭据

2.3 WHEN cli_anything工具接收自然语言命令 "create directory my-folder" 时 THEN 参数 "my-folder" 被丢失，只执行 `mkdir` 而不是 `mkdir my-folder`

#### 运行时Bug类（HIGH/MEDIUM）

3.1 WHEN process-executor.ts 创建临时文件 `temp_${executionId}.js` 后尝试清理时 THEN 清理逻辑查找 `temp_exec_` 模式，导致临时文件无法被删除

3.2 WHEN 用户尝试读取带空格的文件名 `/read file with spaces.txt` 时 THEN _parseArgsToObject只对write_file有特殊处理，read_file按空格分割导致解析失败

3.3 WHEN runGit函数执行git操作失败时 THEN 重试机制永远不会触发，因为Promise没有await导致catch块无法捕获错误

3.4 WHEN src/sandbox/manager.ts 第75行声明 safeStdout 变量时 THEN 系统抛出 TS6133: 'safeStdout' is declared but its value is never read

3.5 WHEN src/tools/tool-registry.ts 第6行导入 safeCmd 时 THEN 系统抛出 TS6133: 'safeCmd' is declared but its value is never read

3.6 WHEN src/tools/tool-registry.ts 第39行 list_dir 处理器接收 dirPath 参数时 THEN 系统抛出 TS6133: 'dirPath' is declared but its value is never read

#### CI/CD加固未完成（P033）

4.1 WHEN 项目根目录缺少 .snyk 文件时 THEN Snyk扫描无法使用ignore基线配置

4.2 WHEN .github/workflows/sonarcloud.yml 执行SonarCloud扫描时 THEN 缺少 -Dsonar.qualitygate.wait=true 参数，无法阻塞失败的Quality Gate

4.3 WHEN .github/workflows/snyk.yml 执行Snyk扫描时 THEN 缺少 --severity-threshold=high 参数，无法过滤低严重性漏洞

4.4 WHEN .github/workflows/sigstore-cosign.yml 在每次push时触发时 THEN 应该只在release发布时触发签名，避免不必要的资源消耗

### Expected Behavior (Correct)

#### 模块恢复与编译修复

5.1 WHEN src/index.ts 导入 './bus/grpc-client.js' 时 THEN 系统应该成功导入GrpcKernelBusClient类并正常使用

5.2 WHEN src/index.ts 导入 './adapters/registry.js' 时 THEN 系统应该成功导入LLMAdapterRegistry类并正常使用

5.3 WHEN src/index.ts 使用 config 变量时 THEN 应该实际使用该变量或移除未使用的导入

5.4 WHEN src/index.ts busClient.onMessage 回调函数接收 msg 参数时 THEN 应该显式声明msg的类型（如 msg: BusMessage）

#### 安全漏洞修复

6.1 WHEN 用户尝试通过cli_anything执行任意命令时 THEN 系统应该完全禁用或物理删除cli_anything工具（参考P030删除execute_command的做法）

6.2 WHEN 用户尝试读取受保护路径的文件时 THEN readWsFile应该检查PROTECTED_PATHS并拒绝访问.env、.git等敏感文件

6.3 WHEN cli_anything工具（如果保留）处理自然语言命令时 THEN 应该正确提取并保留用户输入的参数部分

#### 运行时Bug修复

7.1 WHEN process-executor.ts 清理临时文件时 THEN 应该使用与创建时一致的文件名模式 `temp_` 而不是 `temp_exec_`

7.2 WHEN 用户使用read_file工具读取文件时 THEN _parseArgsToObject应该为read_file添加特殊处理，支持带空格的文件名

7.3 WHEN runGit函数执行git操作时 THEN 应该在Promise前添加await，使错误能够被catch块捕获并触发重试机制

7.4 WHEN src/sandbox/manager.ts 声明 safeStdout 变量时 THEN 应该实际使用该变量记录日志或移除未使用的变量

7.5 WHEN src/tools/tool-registry.ts 导入工具函数时 THEN 应该只导入实际使用的函数，移除未使用的safeCmd导入

7.6 WHEN src/tools/tool-registry.ts list_dir 处理器接收参数时 THEN 应该实际使用dirPath参数或使用下划线前缀标记为有意未使用

#### CI/CD加固完成

8.1 WHEN 项目根目录存在 .snyk 文件时 THEN Snyk扫描应该能够使用配置的ignore规则

8.2 WHEN .github/workflows/sonarcloud.yml 执行扫描时 THEN 应该包含 -Dsonar.qualitygate.wait=true 参数，确保Quality Gate失败时阻塞构建

8.3 WHEN .github/workflows/snyk.yml 执行扫描时 THEN 应该包含 --severity-threshold=high 参数，只报告高严重性及以上的漏洞

8.4 WHEN .github/workflows/sigstore-cosign.yml 触发时 THEN 应该只在 release: types: [published] 事件时执行，而不是每次push

### Unchanged Behavior (Regression Prevention)

#### 编译与类型检查

9.1 WHEN 系统运行 npm run typecheck 时 THEN 所有TypeScript类型检查应该零错误通过

9.2 WHEN 系统运行 npm run build 时 THEN 编译应该成功生成dist目录

9.3 WHEN 系统运行 npm test 时 THEN 所有现有测试应该继续通过

#### 核心功能保持

9.4 WHEN src/sandbox/manager.ts 执行沙盒任务时 THEN 沙盒的隔离、超时、资源限制等核心功能应该保持不变

9.5 WHEN src/tools/tool-registry.ts 注册的其他工具被调用时 THEN execute_code、write_file、search_web等工具应该继续正常工作

9.6 WHEN src/utils/utils.ts 的其他工具函数被调用时 THEN writeWsFile、resolveSafePath等函数应该继续正常工作

#### CI/CD流程保持

9.7 WHEN .github/workflows/ 中的其他工作流执行时 THEN 现有的测试、构建、部署流程应该继续正常工作

9.8 WHEN Snyk和SonarCloud扫描执行时 THEN 扫描结果应该正确上传到各自的平台

## Bug Condition Summary

本次修复涉及4大类共21个问题：

**模块缺失类（4个）**: B1.1-B1.4 - 核心模块缺失导致编译失败
**安全漏洞类（3个）**: B2.1-B2.3 - CRITICAL级别安全漏洞
**运行时Bug类（6个）**: B3.1-B3.6 - 功能Bug和代码质量问题
**CI/CD加固类（4个）**: B4.1-B4.4 - P033未完成的治理加固

修复优先级：
1. **P0 - 安全漏洞**（B2.1, B2.2）- 立即修复
2. **P1 - 编译阻塞**（B1.1, B1.2）- 必须修复才能运行
3. **P2 - 功能Bug**（B2.3, B3.1, B3.2, B3.3）- 影响用户体验
4. **P3 - 代码质量**（B1.3, B1.4, B3.4, B3.5, B3.6）- TypeScript严格合规
5. **P4 - CI/CD加固**（B4.1-B4.4）- 治理完善
