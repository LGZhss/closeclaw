## 2025-04-01 - [Cache OS temp directory]
**Learning:** In Node.js, `os.tmpdir()` reads multiple environment variables synchronously (`TMPDIR`, `TMP`, etc.). Calling it frequently in execution hot-paths (e.g., highly concurrent sandbox executions) can become a measurable performance bottleneck.
**Action:** Cache static OS environment paths at the module scope whenever possible.

## 2025-04-01 - [Avoid redundant path.relative in hot-paths]
**Learning:** Using `path.relative` to check if a target path is inside a parent directory invokes complex path string manipulation under the hood. For simple string matching like `!path.relative(parent, target).startsWith('..')`, implementing a boundary-checked `target.startsWith(parent)` algorithm is up to 60 times faster. Additionally, calling `fs.realpathSync` to statically resolve workspace boundaries dynamically in hot path limits throughput.
**Action:** Implement boundary checks manually with `startsWith` and bounds checking, and cache static invariant paths at the module level.
