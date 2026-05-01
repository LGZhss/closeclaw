## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-01 - Insecure Shared Temporary File Creation

**Vulnerability:** The ProcessExecutor writes temporary code files to the shared os.tmpdir() without explicit restrictive permissions, allowing local unauthorized users to read or modify the code before it is executed (TOCTOU vulnerability).
**Learning:** Default file permissions in shared temporary directories are often overly permissive.
**Prevention:** Always explicitly set restrictive file permissions (e.g., passing { mode: 0o600 }) when writing to shared temporary directories (e.g., using fsPromises.writeFile).
