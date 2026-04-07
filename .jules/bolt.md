## 2025-04-07 - Avoid Synchronous Event Loop Blocking with fs.existsSync

**Learning:** Using `fs.existsSync` synchronously before asynchronous I/O operations (like `fsPromises.unlink`, `fsPromises.mkdir`, or `fsPromises.readFile`) unnecessarily blocks the Node.js event loop and degrades performance under load. Node's `recursive: true` option for `mkdir` handles existing directories natively, and `unlink` can be safely called and its `ENOENT` error caught.
**Action:** Always call the asynchronous operation directly and handle the `ENOENT` error in the catch block (using short-circuit evaluation like `e.code === 'ENOENT' || logger.warn(...)`) instead of pre-checking existence.
