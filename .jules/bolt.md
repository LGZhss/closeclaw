## 2026-04-23 - Prevent Event Loop Blocking in Tool Registry

**Learning:** High-traffic tools in `src/tools/tool-registry.ts` like `read_file` and `write_file` were using synchronous `readWsFile` and `writeWsFile` which block the Node.js event loop under heavy LLM request loads.
**Action:** Always use asynchronous equivalents (`readWsFileAsync`, `writeWsFileAsync`) for I/O operations in high-traffic endpoints to prevent blocking.

## 2026-04-24 - fs-cleanup optimization

**Learning:** Sequential file operations (like fsPromises.stat and unlink inside a loop) can significantly block progress when managing large temporary directories.
**Action:** Use Promise.all with batching (chunk size 50) to optimize file processing without triggering Node.js EMFILE (too many open files) errors.

## 2025-02-18 - Optimize path traversal checks using Set and segment matching

**Learning:** Using `Set.has()` and checking path segments (`indexOf('/')` and `substring()`) is significantly faster than using `.startsWith()` in a loop over an array of paths, yielding a ~57% performance improvement for path validation.
**Action:** Apply this pattern when checking if a normalized path falls under any of a predefined list of protected root directories.
