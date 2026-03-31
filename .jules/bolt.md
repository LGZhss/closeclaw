## 2024-10-24 - [Node.js os.tmpdir() Synchronous Bottleneck]

**Learning:** In highly concurrent sandbox execution loops (`ProcessExecutor.execute`), resolving `os.tmpdir()` synchronously adds measurable latency (40x slower) due to repetitive OS environment variable resolution (`TMPDIR`, `TMP`, etc).
**Action:** Cache static environment paths like `os.tmpdir()` at the module scope if they are queried continuously in hot paths.
