## 2024-04-20 - Concurrent File Cleanup Optimization

**Learning:** Node.js file system performance can be bottlenecked by sequential I/O loops (`for...of`). Concurrent execution with `Promise.all` significantly speeds up I/O, but unbounded concurrency can crash with EMFILE (too many open files).
**Action:** Always batch I/O operations (e.g., using chunks of 50 files) when converting sequential file processing into concurrent execution.
