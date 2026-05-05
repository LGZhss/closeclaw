## 2026-04-24 - Cryptographically Insecure executionId Generation

**Vulnerability:** The ProcessExecutor used `Math.random()` to generate `executionId`s, which is predictable and insecure for cross-execution tracking.
**Learning:** Randomness in sandboxed environments must be cryptographically secure to prevent identifier collisions and execution manipulation.
**Prevention:** Always use Node.js `crypto.randomBytes()` instead of `Math.random()` for any system-level identifiers.

## 2026-05-05 - Secure Temporary File Creation

**Vulnerability:** Sandbox execution code was being written to `os.tmpdir()` without explicit restrictive file permissions.
**Learning:** Shared temporary directories on multi-user systems can expose files to unauthorized read or write access if the default umask is permissive. This can lead to TOCTOU vulnerabilities where malicious actors modify code between creation and execution.
**Prevention:** Always explicitly set restrictive file permissions (e.g., `{ mode: 0o600 }`) when writing to shared temporary directories using Node.js filesystem APIs.

## 2026-05-05 - Third-Party Dependency Vulnerabilities

**Vulnerability:** `protobufjs@7.5.4` contained an Arbitrary Code Injection vulnerability (SNYK-JS-PROTOBUFJS-16094665), introduced via `@grpc/proto-loader`.
**Learning:** Even well-maintained third-party dependencies can introduce critical vulnerabilities deep in the dependency tree. Regular automated scanning (like Snyk) is essential to catch these.
**Prevention:** Always maintain up-to-date dependencies and address security alerts from tools like Snyk immediately. For deeply nested dependencies, forced upgrades or overrides in `package.json` may be required.
