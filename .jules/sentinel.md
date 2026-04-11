## 2024-04-12 - [Path Traversal Bypass via startsWith and Unresolved Relative Path]

**Vulnerability:** The application used `.startsWith()` for boundary checks and validated blacklists against unresolved relative paths (e.g., `src/../.env`), allowing attackers to bypass protections.
**Learning:** Path strings are unsafe for prefix checks because `/path/to/folder-secret` starts with `/path/to/folder`. Blocklists must be evaluated against fully resolved paths.
**Prevention:** Always fully resolve the target path using `path.resolve()`, compute the true relative path with `path.relative()`, and ensure it doesn't start with `..` or is absolute before checking blacklists.
