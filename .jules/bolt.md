## 2026-04-24 - fs-cleanup optimization

**Learning:** Sequential file operations (like fsPromises.stat and unlink inside a loop) can significantly block progress when managing large temporary directories.
**Action:** Use Promise.all with batching (chunk size 50) to optimize file processing without triggering Node.js EMFILE (too many open files) errors.

## 2025-02-18 - Optimize path traversal checks using Set and segment matching

**Learning:** Using `Set.has()` and checking path segments (`indexOf('/')` and `substring()`) is significantly faster than using `.startsWith()` in a loop over an array of paths, yielding a ~57% performance improvement for path validation.
**Action:** Apply this pattern when checking if a normalized path falls under any of a predefined list of protected root directories.

## 2026-04-28 - Asynchronous File Operations in Tool Handlers

**Learning:** Using synchronous file operations (`readWsFile`, `writeWsFile`) in tool handlers blocks the Node.js event loop, preventing the concurrent processing of multiple LLM requests or other tools. This creates a significant performance bottleneck and reduces throughput when under load.
**Action:** Always prefer asynchronous file operations (`readWsFileAsync`, `writeWsFileAsync`) combined with `async/await` inside event-handling or request-handling logic to keep the event loop non-blocking and improve scalability.
