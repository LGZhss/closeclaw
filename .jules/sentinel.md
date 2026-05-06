## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-06 - Secure Temporary File Permissions

**Vulnerability:** Insecure file permissions when writing execution code to the shared `os.tmpdir()`.
**Learning:** Writing sensitive code or configuration to a shared temp directory without explicit restrictive permissions exposes it to reading and TOCTOU modification by other local users.
**Prevention:** Always pass `{ mode: 0o600 }` to `fsPromises.writeFile` (or similar functions) when creating sensitive files in shared temporary directories.
