## 2026-04-19 - [Fix Insecure Random Number Generation]
**Vulnerability:** Used Math.random() to generate executionIds for ProcessExecutor code and commands. Math.random() is predictable and cryptographically insecure, which might lead to ID collisions and cross-execution manipulation or monitoring.
**Learning:** Math.random() is explicitly discouraged for security-sensitive ID generation like execution IDs. Found notes about this in `docs/03-development/deep-content-audit-level5.md`.
**Prevention:** Always use `crypto.randomBytes(N).toString("hex")` or a secure UUID generation library like `uuid` for generating random identifiers.
