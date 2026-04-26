## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-04-26 - Fix Command Injection in Git Utilities


**Vulnerability:** The `runGit` and `isGitRepo` functions in `src/utils/utils.ts` used `execSync` with string interpolation (`git ${args.join(" ")}`), making them susceptible to command injection if malicious arguments were passed.
**Learning:** Using string interpolation with functions that execute shell commands (like `execSync` or `exec`) introduces severe command injection risks when handling user or untrusted input.
**Prevention:** Always use safe child process execution methods like `execFileSync` or `spawn` with `shell: false` and pass arguments as an array rather than a single string.
