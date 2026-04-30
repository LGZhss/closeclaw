## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-04-30 - Insecure Temporary File Permissions
**Vulnerability:** Temporary files created in os.tmpdir() used default permissions, allowing potential unauthorized read/write access by other users on the system.
**Learning:** Shared temporary directories are vulnerable to local attacks. Files written here must explicitly use restrictive permissions.
**Prevention:** Always pass explicit restrictive file permissions (e.g., { mode: 0o600 }) when writing sensitive data to shared temporary directories.
