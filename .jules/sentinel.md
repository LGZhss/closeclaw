## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-04-29 - Insecure Temporary File Creation

**Vulnerability:** The ProcessExecutor writes executable code to a temporary file in a shared directory (`os.tmpdir()`) without specifying restricted file permissions, allowing other system users to read or modify the file before execution.
**Learning:** Files created in shared temporary directories must have strict permissions to prevent unauthorized access and TOCTOU attacks.
**Prevention:** Always explicitly pass `{ mode: 0o600 }` when creating temporary files using `fs.writeFile` or `fsPromises.writeFile`.
