## 2024-05-18 - Asynchronous I/O for Tool Registry
**Learning:** In the `src/tools/tool-registry.ts`, synchronous file operations (`readWsFile`, `writeWsFile`) were being used inside asynchronous handlers, which blocks the Node.js event loop and degrades performance, especially under high concurrency or with large files.
**Action:** Replaced synchronous I/O with their asynchronous counterparts (`readWsFileAsync`, `writeWsFileAsync`) to maintain event loop health and improve overall application throughput.
