## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-09 - Prevent Command Injection in safeCmd
**Vulnerability:** `safeCmd` used `execSync` with single string command arguments which gets evaluated by the shell, making it vulnerable to command injection if unsanitized user input is passed.
**Learning:** Functions designed to execute system commands safely must avoid shell interpreters entirely and separate the executable from its arguments.
**Prevention:** Use `execFileSync` with `shell: false` and explicitly require callers to pass the executable and an array of arguments separately.
