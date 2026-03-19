# CloseClaw 协作准则 - Sentinel 专项引导

🛡️ 欢迎，Sentinel。安全重于一切，但协作必须有序。请遵守以下法律：

## 1. 提案先行 (Proposal First)
即使是紧急修复，也必须在 `votes/` 录入提案备份（可事后补录，但建议先行）。
- **文件名**: `proposal-[编号]-security-[漏洞类型].md`
- **必填信息**: 漏洞描述（注意脱敏）、修复方案。
- **状态标记**: `✅ 已通过（用户提出特批）`

## 2. 语言规范 (Language Policy)
- **所有外部展示内容（PR/提案/备注）必须使用简体中文**。

## 3. 提交备注 (Attribution)
- `Proposal-By`: Google Labs Jules (Sentinel)
- `Implemented-By`: Google Labs Jules (Sentinel)
- **链接**: 必须链接到对应的 `votes/` 提案。

## 4. 紧急避险
如果是极高危风险（Secret Leak 等），准许直接推送修复，但必须在 Commit Message 中使用中文注明原因，并随后补齐 CloseClaw 提案文档。

---
**Sentinel's Note**: 
安全漏洞的修补必须是透明且可审计的。CloseClaw 提案是你修补行为的法律依据。
## 2025-03-15 - [Secure Temporary File Creation]
**Vulnerability:** Untrusted Javascript code was being written directly into the current working directory (`process.cwd()`) and executed via `child_process.spawn`. The file paths were unquoted relative paths (`node temp_${id}.js`), which allowed directory pollution, path traversal possibilities if the execution ID was manipulated, and potential command injection.
**Learning:** The application evaluates code by dynamically creating and running files. Hardcoded relative paths expose the current directory.
**Prevention:** Use `os.tmpdir()` alongside `path.join()` for temporary code file generation, and enclose the file path in double quotes (`"..."`) when formulating the shell execution command.

## 2024-03-20 - [Command Injection via Shell Execution]
**Vulnerability:** `executeCommand` in `ProcessExecutor` executes user-provided command via `/bin/sh -c <command>` which makes it vulnerable to command injection, as untrusted input can execute arbitrary commands bypassing intended commands or directories. The vulnerability is triggered in `cliAnything` when user input with shell metacharacters is constructed and executed.
**Learning:** Checking for specific dangerous commands (`rm -rf /`, `format`, etc) is insufficient because attackers can chain commands using `;`, `&&`, `|` or subshells to bypass those checks and execute arbitrary code on the host.
**Prevention:** Always combine dynamic CLI command execution with a strict regex check to reject shell metacharacters (`[;&|<>$]`) to prevent command chaining and injection.
