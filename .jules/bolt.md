## 2026-04-18 - Chunked Concurrency for File System Operations
**Learning:** Unbounded concurrent file system operations (like `fsPromises.stat` or `unlink`) using `Promise.all()` on large directories can trigger Node.js `EMFILE` (too many open files) errors.
**Action:** Always batch or chunk concurrent file system operations (e.g., using a chunk size of 50) when processing directories to prevent exhausting file descriptors while maintaining I/O efficiency.
