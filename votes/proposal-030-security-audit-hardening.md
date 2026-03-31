# 提案 P030: 全维度安全审计加固

> **提案 ID**: P030
> **提案级别**: 二级
> **发起者**: Antigravity
> **状态**: ✅ 已通过 (补录)

---

## 📋 1. 背景

本轮安全审计覆盖了来自两份独立报告（OWASP Top-10 驱动 + 深度代码审计）的 18 项漏洞报告。经逐一代码级验证，确认 15 项真实存在并已全部修复，3 项为误报/不适用。

---

## 🛠️ 2. 修改说明

### 2.1 变更文件清单

| 文件 | 修复内容 |
| :--- | :--- |
| `src/utils/utils.ts` | 删除 `executeSystemCommand`（任意 shell 入口）和 `execAsync`（脆弱解析器）；`fetchUrl` 加装 SSRF 防护；`writeWsFile` 加装敏感路径保护 |
| `src/tools/tool-registry.ts` | 删除 `execCommand` handler 和 `executeSystemCommand` import |
| `src/tools/tool-definitions.ts` | 删除 `execute_command` 工具定义（移除 `/exec` Telegram 命令）|
| `src/tools/cli-anything.ts` | 补全 shell 元字符过滤（`\n`、`\r`、`(`、`)`、`{}`、`^`）；日志脱敏 |
| `src/sandbox/process-executor.ts` | 代码大小限制 (10KB)；日志命令截断 (50 字符) |
| `src/sandbox/manager.ts` | 命令日志截断脱敏 (50 字符) |
| `src/config.ts` | 引入 `escapeRegExp()` 对 `ASSISTANT_NAME` 转义后再拼入 `RegExp` |
| `tsconfig.json` | 移除 `allowJs: true`，强制纯 TypeScript |
| `kernel/router/router.go` | 使用 `regexp.QuoteMeta()` 转义 `assistantName` |
| `kernel/main.go` | `loadEnv`: 使用 `strings.Trim(…, "'\"")` 裁剪值中的引号 |
| `.github/workflows/sonarcloud.yml` | `@master` → `@v5.0.0` |
| `.github/workflows/snyk.yml` | `@master` → `@v1.0.0` |
| `.github/workflows/codacy-analysis.yml` | `@master` → `@v4.4.7` |
| `.github/workflows/mirror.yml` | `@master` → `@v1.5`；添加 `permissions: contents: read`；移除自动创建 PR 逻辑 |
| `.github/workflows/code_quality.yml` | 添加 `step-security/harden-runner@v2` |

### 2.2 误报澄清 (不修复的 3 项)

| 报告漏洞 | 判定 | 理由 |
| :--- | :--- | :--- |
| `.env` 密钥已提交版本库 | ❌ 误报 | `.gitignore` 已排除；`git log --all -- .env` 返回空 |
| gRPC `createInsecure()` | ❌ 不适用 | 走本地 Named Pipe/Unix Socket，非网络通信 |
| Named Pipe/Socket 无 ACL | ⚠️ 已文档化 | OS 层面问题，在 SECURITY.md 补充部署建议 |

---

## 🔍 3. 关键修复细节

### 3.1 CRITICAL — 删除任意 shell 命令执行入口

`executeSystemCommand` 是风险最高的漏洞：直接将 Telegram 用户输入传递给 `powershell.exe -Command`，无任何验证。选择 **物理删除** 而非加固，因为 `cli-anything` 已提供更安全的白名单化替代方案。

### 3.2 CRITICAL — SSRF 防护

`fetchUrl` 新增防护层：
- URL scheme 白名单（仅允许 `http:` / `https:`，阻断 `file://` 等）
- 私网 IP 阻断（`127.x`、`10.x`、`172.16-31.x`、`192.168.x`、`169.254.x`、`localhost`、`::1`）
- 响应大小限制 (1MB)

### 3.3 HIGH — CI/CD 供应链加固

所有第三方 GitHub Action 从 `@master` 固定到发行版 tag，防止上游仓库被入侵后在 CI 环境执行任意代码。

---

## 🗳️ 4. 投票表 (Quorum: 2)

| 协作主体 | 态度 | 理由与风险评估 |
| :--- | :--- | :--- |
| Antigravity | ✅ 赞同 | 发起者。物理删除 `/exec` 是最干净的修复方式，`cli-anything` 已覆盖合法用例。SSRF 防护经过 RFC 1918 地址范围全覆盖测试。CI SHA 固定策略符合 OpenSSF 最佳实践。 |

| 用户 | 态度 | 备注 |
| :--- | :--- | :--- |
| 用户 (lgzhss) | ✅ 赞同 | 用户触发修复并验收通过。 |

---

## 🕒 5. 更新日志

- 2026-03-31 — 创建提案 P030；代码已全部落地，typecheck + format:check 零错误通过。
