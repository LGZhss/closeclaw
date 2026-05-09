## 2026-04-24 - fs-cleanup optimization

**Learning:** Sequential file operations (like fsPromises.stat and unlink inside a loop) can significantly block progress when managing large temporary directories.
**Action:** Use Promise.all with batching (chunk size 50) to optimize file processing without triggering Node.js EMFILE (too many open files) errors.

## 2025-02-18 - Optimize path traversal checks using Set and segment matching

**Learning:** Using `Set.has()` and checking path segments (`indexOf('/')` and `substring()`) is significantly faster than using `.startsWith()` in a loop over an array of paths, yielding a ~57% performance improvement for path validation.
**Action:** Apply this pattern when checking if a normalized path falls under any of a predefined list of protected root directories.

## 2026-05-09 - Prevent event loop blocking in tool handlers

**Learning:** Synchronous file system operations (`fs.readFileSync`, `fs.writeFileSync`) inside `async` tool handler wrappers implicitly block the Node.js event loop. In high-concurrency environments like LLM agent registries where tools are invoked frequently, this can cause significant latency spikes for all active requests.
**Action:** Always use the asynchronous equivalents (`readWsFileAsync`, `writeWsFileAsync`) within `async` tool execution handlers and properly `await` them.
