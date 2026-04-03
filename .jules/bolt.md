## 2024-05-24 - [Avoid Multiple `ReplaceAll` passes in Hot Paths]
**Learning:** Using sequential `strings.ReplaceAll` for XML escaping performs multiple passes and allocations. For strings with special characters, a single pass with `strings.IndexAny` and a pre-sized `strings.Builder` is ~25-30% faster.
**Action:** Use `strings.Builder` with `Grow` and a single-pass loop when escaping or replacing multiple character types in hot paths.
