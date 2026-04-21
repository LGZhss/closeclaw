## 2024-05-20 - Insecure Random Number Generation for Execution IDs

**Vulnerability:** Weak identifier generation using `Math.random()` to generate `executionId`s in `ProcessExecutor` (`src/sandbox/process-executor.ts`).
**Learning:** This predictability can lead to identifier collisions or allow for cross-execution manipulation, violating security requirements for isolating process executions.
**Prevention:** Use cryptographically secure mechanisms, such as Node's built-in `crypto.randomBytes` or `crypto.randomUUID()`.
