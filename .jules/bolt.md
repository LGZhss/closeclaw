## 2026-04-17 - File I/O Concurrency with Batching
**Learning:** When dealing with asynchronous file I/O operations (like stat/unlink) in a loop, sequential processing `await` inside a `for...of` is too slow. Unbounded `Promise.all()` on a large directory causes `EMFILE` (too many open files) errors.
**Action:** Group asynchronous file operations into bounded chunks (e.g., 50) and use `await Promise.all()` on each chunk to balance speed and stability.
