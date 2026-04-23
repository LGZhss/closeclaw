## 2026-04-23 - Prevent Event Loop Blocking in Tool Registry

**Learning:** High-traffic tools in `src/tools/tool-registry.ts` like `read_file` and `write_file` were using synchronous `readWsFile` and `writeWsFile` which block the Node.js event loop under heavy LLM request loads.
**Action:** Always use asynchronous equivalents (`readWsFileAsync`, `writeWsFileAsync`) for I/O operations in high-traffic endpoints to prevent blocking.
