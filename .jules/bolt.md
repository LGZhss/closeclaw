## 2024-04-19 - Batch File System Operations

**Learning:** Sequential `await` in loops over many file system operations blocks execution unnecessarily, but unrestricted `Promise.all` can cause `EMFILE` errors due to Node.js hitting OS open file limits.
**Action:** Use chunking (e.g., 50 files at a time) with `Promise.all` and `.map()` to achieve a safe balance between concurrency and resource limits when performing file I/O over large directories.
