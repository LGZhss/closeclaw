## 2024-05-24 - Path Traversal Blocklist Bypass

**Vulnerability:** The protected file blocklist checking in `readWsFile` and `writeWsFile` only checked against user input string directly. An attacker could bypass the blocklist using path traversal like `src/../.env`.
**Learning:** String replacement or partial matches are insufficient for enforcing path constraints against user input; path resolution must fully normalize inputs prior to validation.
**Prevention:** Always fully resolve paths (e.g., `resolveSafePath`) and compute standard normalized paths (e.g., `path.relative`) before evaluating against blocklists.
