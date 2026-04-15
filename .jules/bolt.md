## 2024-05-24 - [Optimize fs-cleanup.ts temp files]

**Learning:** Sequential await fsPromises calls loop in cleanupTmpFiles blocks main thread heavily.
**Action:** Use Promise.all with tempFiles.map for concurrent I/O resolution instead of for (const ...) loop.
