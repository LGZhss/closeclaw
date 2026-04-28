## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-04-28 - Command Injection in runGit via execSync

**Vulnerability:** The `runGit` function used `execSync(\`git ${args.join(" ")}\`)`, which invoked a shell and allowed command injection via shell metacharacters in the `args`array.
**Learning:** Even when wrapping a known executable like`git`, concatenating arguments and executing via a shell interpreter (`execSync`) opens up command injection vulnerabilities.
**Prevention:** Always use `child_process.execFileSync(executable, [args])`or`child_process.spawn`with`shell: false`instead of`execSync` when executing commands with user-controlled arguments.
