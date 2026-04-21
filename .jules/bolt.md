## 2026-04-21 - Batched I/O for Temp File Cleanup
**Learning:** Sequential asynchronous file operations (like `fsPromises.stat` and `unlink` in a loop) create a significant performance bottleneck when processing large temporary directories. However, unbounded `Promise.all` can cause Node.js `EMFILE` errors (too many open files).
**Action:** Always batch concurrent I/O operations (e.g., using chunks of 50 files with `Promise.all`) to safely maximize throughput while avoiding OS-level resource limits.
