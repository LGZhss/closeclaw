## 2025-04-01 - [Cache OS temp directory]

**Learning:** In Node.js, `os.tmpdir()` reads multiple environment variables synchronously (`TMPDIR`, `TMP`, etc.). Calling it frequently in execution hot-paths (e.g., highly concurrent sandbox executions) can become a measurable performance bottleneck.
**Action:** Cache static OS environment paths at the module scope whenever possible.
