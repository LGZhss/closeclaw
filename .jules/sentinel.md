## 2024-04-08 - Path Traversal Bypass via Partial Prefix Matching
**Vulnerability:** `startsWith` used for path boundary checks allows accessing directories with the same prefix (e.g., `/app-secrets` when validating `/app`).
**Learning:** Basic string prefix matching is insufficient for path traversal prevention because it doesn't account for directory boundaries (`path.sep`).
**Prevention:** Always check if the resolved path exactly matches the base path OR starts with the base path followed by a directory separator (`path.sep`).
