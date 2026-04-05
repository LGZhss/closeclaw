## 2026-04-05 - Avoid synchronous existsSync before unlink
**Learning:** Checking `fs.existsSync` before an asynchronous `unlink` operation or inside async tool execution blocks the Node.js event loop unnecessarily. The error should be caught from the async operation instead. Tool handlers in `tool-registry.ts` used synchronous I/O, creating a bottleneck.
**Action:** Directly call asynchronous operations like `fsPromises.unlink().catch(() => {})` and use async file read/write methods (`readWsFileAsync`/`writeWsFileAsync`) in high-throughput handlers.
