## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-08 - Insecure Temporary File Permissions
**Vulnerability:** Temporary files containing execution payloads were written to `os.tmpdir()` without explicit permissions, defaulting to system standard permissions and potentially allowing unauthorized read/modify access by other users on the system.
**Learning:** Default file creation permissions in shared system directories like `/tmp` can expose sensitive content or introduce Time-of-Check to Time-of-Use (TOCTOU) vulnerabilities if an attacker modifies the file before execution.
**Prevention:** Always explicitly define restrictive file permissions (e.g., `{ mode: 0o600 }`) when writing sensitive or executable files to shared temporary directories.
