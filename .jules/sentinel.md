## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-03 - Command Injection in safeCmd

**Vulnerability:** The `safeCmd` utility used `execSync` with a concatenated command string, which routes through a shell and exposes the system to command injection via metacharacters.
**Learning:** Shell-executing functions (like `execSync`) are inherently dangerous for dynamic inputs.
**Prevention:** Always use `execFileSync` or `spawn` with `shell: false` and pass the executable file and its arguments as separate array elements.
