## 2024-04-01 - Path Traversal Bypass in Protected Files List
**Vulnerability:** Path traversal payload (e.g., `src/../.env`) bypasses the simple string-based `startsWith` check against `PROTECTED_PATHS` for reading/writing sensitive files in the workspace.
**Learning:** String prefix checks and basic `.replace` logic are insufficient for blocking malicious paths. Relative path segments like `..` can bypass the check before the path is resolved to an absolute path.
**Prevention:** Always fully resolve untrusted paths using `path.resolve()` and compare the normalized relative path (`path.relative()`) against the blocklist to accurately enforce protected files.
