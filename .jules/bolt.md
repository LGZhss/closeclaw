## 2026-04-09 - Avoid Synchronous File System Checks
**Learning:** Using synchronous `fs.existsSync` before asynchronous file system operations (like `fsPromises.unlink`, `fsPromises.mkdir`, `fsPromises.readFile`) unnecessarily blocks the Node.js event loop, degrading performance in high-concurrency environments like the sandbox executor.
**Action:** Always rely on native options (like `{ recursive: true }` for mkdir) or call the asynchronous operation directly and handle the `ENOENT` error in the `catch` block to avoid blocking the event loop.
