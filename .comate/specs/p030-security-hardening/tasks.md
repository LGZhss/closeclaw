# P030: 安全审计加固 — 全维度漏洞修复

- [x] Task 1: 删除 `executeSystemCommand` 和 `execAsync`，移除 `/exec` 工具
  - 1.1: 从 `src/utils/utils.ts` 删除 `executeSystemCommand` (L13-34) 和 `execAsync` (L39-83) 函数，移除 `spawn` import
  - 1.2: 从 `src/tools/tool-registry.ts` 移除 `executeSystemCommand` import、`execCommand` handler 绑定、`execCommand` 方法、`_parseArgsToObject` 中 `execute_command` 特殊处理
  - 1.3: 从 `src/tools/tool-definitions.ts` 删除 `execute_command` 工具定义 (L7-20)

- [x] Task 2: 加固 `fetchUrl` — SSRF 防护
  - 2.1: 添加 URL scheme 白名单 (仅 http/https)
  - 2.2: 添加私网 IP 和云元数据地址阻断 (127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x, localhost, ::1)
  - 2.3: 添加响应大小限制 (1MB)

- [x] Task 3: 加固 `writeWsFile` — 敏感文件保护
  - 3.1: 添加 PROTECTED_PATHS 列表 (.git, .env, package.json 等)
  - 3.2: 在写入前校验路径，拒绝匹配保护路径的请求

- [x] Task 4: 加固 `TRIGGER_PATTERN` — 正则注入防护
  - 4.1: 在 `src/config.ts` 添加 `escapeRegExp` 工具函数
  - 4.2: 对 `ASSISTANT_NAME` 转义后再拼入 RegExp

- [x] Task 5: 沙盒执行器加固 — 代码大小限制与日志脱敏
  - 5.1: `ProcessExecutor.execute()` 添加 10KB 代码大小限制
  - 5.2: `ProcessExecutor._executeProcess()` 日志脱敏（命令截断到 50 字符）
  - 5.3: `SandboxManager.executeCommand()` 日志脱敏
  - 5.4: `cli-anything.ts` 完善元字符过滤（添加 `\n`, `\r`, `(`, `)`, `{`, `}`, `^`）并脱敏日志
  - 5.5: `cli-anything.ts` 添加 `rm -rf ~` 等扩展危险模式检测

- [x] Task 6: 移除 `tsconfig.json` 的 `allowJs`
  - 6.1: 删除 `"allowJs": true` 行

- [x] Task 7: Go 内核加固
  - 7.1: `router.go` 使用 `regexp.QuoteMeta()` 转义 `assistantName`
  - 7.2: `main.go` `loadEnv` 裁剪值中的引号字符
  - 7.3: `listen_windows.go` 为 Named Pipe 添加安全描述符（限制当前用户 SID）

- [x] Task 8: CI/CD 工作流加固
  - 8.1: 固定 `sonarcloud.yml` 第三方 Action 到 SHA
  - 8.2: 固定 `snyk.yml` 第三方 Action 到 SHA
  - 8.3: 固定 `codacy-analysis.yml` 第三方 Action 到 SHA
  - 8.4: 固定 `mirror.yml` 第三方 Action 到 SHA
  - 8.5: `mirror.yml` 添加 `permissions: contents: read`，废除自动 PR 逻辑，修复分支名引用
  - 8.6: `code_quality.yml` 添加 `step-security/harden-runner@v2`

- [x] Task 9: 验证 — typecheck、测试、格式检查
  - 9.1: 运行 `npm run typecheck` 确认类型检查通过
  - 9.2: 运行 `npm test` 确认现有测试不受影响
  - 9.3: 运行 `npm run format:check` 确认格式合规
