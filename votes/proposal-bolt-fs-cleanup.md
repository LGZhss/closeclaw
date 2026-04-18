# 提案：优化 cleanupTmpFiles 的并发执行

✅ 已通过（用户特批）

## 1. 背景
`src/utils/fs-cleanup.ts` 中的 `cleanupTmpFiles` 函数目前使用顺序的 `for` 循环来读取文件状态并删除过期的临时文件。在临时文件较多时，顺序执行效率低下。

## 2. 方案
使用分块并发（Chunked Concurrency）的方式，将文件分批次（如每批 50 个）使用 `Promise.all()` 进行并发处理。

## 3. 影响
提高大批量临时文件清理的速度，同时避免因为并发过大导致 Node.js 抛出 `EMFILE`（打开文件过多）错误。
