## 2026-04-09 - Path Traversal via `.startsWith()` and Blocklist Bypass

**Vulnerability:** Path traversal bypass in `resolveSafePath` when `targetPath.startsWith(absoluteBase)` is used. If base is `/app`, path `/app-secrets` bypasses this check. Also, using untrusted relative paths like `src/../.env` allowed bypassing string-replacement based blocklist checks.
**Learning:** `startsWith()` does not enforce directory boundaries. Normalizing string inputs with `.replace` instead of true path resolution allows bypassing blacklists with `..` segments.
**Prevention:** Always compute the fully resolved relative path using `path.relative(absoluteBase, targetPath)`. Ensure it does not start with `..` and is not absolute. Validate blocklists against the properly resolved relative path, not the untrusted user input string.
