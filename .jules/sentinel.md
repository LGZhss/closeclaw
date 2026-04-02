## 2024-04-02 - [Path Traversal Bypass in Blocklist]
**Vulnerability:** The application used simple string replacement (`filePath.replace...`) to validate paths against a blocklist (`PROTECTED_PATHS`), allowing bypasses via traversal segments like `src/../.env`.
**Learning:** String-based validation is insufficient for path security, as it does not account for how the OS or path resolution utilities handle relative segments (`..`).
**Prevention:** Always fully resolve the path using `path.resolve()` and `fs.realpathSync()`, compute the exact relative path from the root directory using `path.relative()`, and validate this normalized string against the blocklist.
