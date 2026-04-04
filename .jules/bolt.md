## 2024-04-04 - [Performance Optimization] Asynchronous I/O in Agent Tool Execution

**Learning:** Synchronous file system operations (`fs.readFileSync`, `fs.writeFileSync`) were used within `tool-registry.ts` to execute `read_file` and `write_file` agent tools. In a highly concurrent Node.js environment handling long-polling (Telegram messages) and LLM inference processing via gRPC, synchronous operations block the event loop, causing latency spikes and message queuing delays, despite the raw latency for small files appearing low.
**Action:** Always prefer asynchronous file operations (`fs.promises`) for any I/O tasks invoked through agent tools to maintain Node.js event loop responsiveness. Replaced `readWsFile` with `readWsFileAsync` and `writeWsFile` with `writeWsFileAsync`.
