## 2025-05-15 - Concurrent File Operations

**Learning:** Sequential file operations (like fsPromises.stat and unlink) in a loop can be a performance bottleneck for directory cleanup. However, using naive Promise.all for all files can cause EMFILE (Too many open files) errors when dealing with large directories.
**Action:** Always batch/chunk concurrent file system operations (e.g., processing 50 files at a time) to safely optimize disk I/O without overwhelming the OS limits.
