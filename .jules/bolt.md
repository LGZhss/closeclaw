## 2026-04-24 - fs-cleanup optimization

**Learning:** Sequential file operations (like fsPromises.stat and unlink inside a loop) can significantly block progress when managing large temporary directories.
**Action:** Use Promise.all with batching (chunk size 50) to optimize file processing without triggering Node.js EMFILE (too many open files) errors.

## 2025-02-18 - Optimize path traversal checks using Set and segment matching

**Learning:** Using `Set.has()` and checking path segments (`indexOf('/')` and `substring()`) is significantly faster than using `.startsWith()` in a loop over an array of paths, yielding a ~57% performance improvement for path validation.
**Action:** Apply this pattern when checking if a normalized path falls under any of a predefined list of protected root directories.

## 2026-04-30 - Replace synchronous readWsFile and writeWsFile in ToolRegistry
**Learning:** In src/tools/tool-registry.ts, the read_file and write_file handlers were blocking the Node.js event loop by using synchronous file operations (readWsFile, writeWsFile), degrading performance during concurrent LLM requests.
**Action:** Replace synchronous file system APIs with their asynchronous counterparts (readWsFileAsync and writeWsFileAsync) in tool handler implementations to allow the event loop to continue processing other requests while waiting for file I/O.
