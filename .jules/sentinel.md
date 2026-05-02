## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-02 - Insecure File Permissions on Temporary Files

**Vulnerability:** Files written to shared directories (like os.tmpdir()) or workspace directories were missing explicit permission modes, allowing other users to read or modify them before execution.
**Learning:** Default file permissions might be too permissive in shared environments, leading to TOCTOU and unauthorized access.
**Prevention:** Always explicitly pass restrictive file permissions (e.g., { mode: 0o600 }) when creating files with fs.writeFileSync or fsPromises.writeFile.
