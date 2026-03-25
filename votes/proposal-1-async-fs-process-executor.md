# Proposal 1: 异步文件系统操作优化 (Process Executor)

✅ 已通过（用户提出特批）

## 1. 性能瓶颈
在 `src/sandbox/process-executor.ts` 文件中，执行沙盒代码时使用了同步的文件系统操作：
- `fs.writeFileSync`
- `fs.unlinkSync`
- `fs.existsSync`

在高并发场景下，或者文件系统负载较高时，这些同步操作会阻塞 Node.js 的主事件循环，导致其他异步操作（如网络请求、数据库查询）被延迟，进而降低整体系统的吞吐量和响应速度。这与 `.jules/bolt.md` 中记录的 "File System Operations Blocking Event Loop" 性能缺陷模式一致。

## 2. 优化思路
将所有的同步文件系统操作替换为异步的 `fs.promises` 方法：
- `fs.writeFileSync` 替换为 `await fs.promises.writeFile`
- `fs.unlinkSync` 替换为 `await fs.promises.unlink`
- 取消使用 `fs.existsSync`，因为 `unlink` 本身在文件不存在时会抛出异常，可以直接 `catch` 忽略，从而减少一次磁盘 I/O 检查。

由于 `execute` 方法本身返回一个 `Promise` 并且已经在使用 `async/await`，这种改造非常自然，且不会改变原本的逻辑和接口行为。同时修复错误处理中回调里需要异步调用的清理逻辑，由于错误清理原本是同步的，如果使用异步 `unlink` 并 `catch`，需要小心处理 `Promise` 的 resolve/reject（在我们的情况中，我们可以直接使用异步并 `await`，或者在非 async 函数直接调用 `.catch()`）。

## 3. 预期的 Diff 变更
```diff
- import fs from 'fs';
+ import fs from 'fs';

  // ...
-        fs.writeFileSync(tempFile, code);
+        await fs.promises.writeFile(tempFile, code);

-          try {
-            fs.unlinkSync(tempFile);
-          } catch (e) {
-            // 忽略清理错误
-          }
+          try {
+            await fs.promises.unlink(tempFile);
+          } catch (e) {
+            // 忽略清理错误
+          }

-          try {
-            if (fs.existsSync(tempFile)) {
-              fs.unlinkSync(tempFile);
-            }
-          } catch (e) {
-            // 忽略清理错误
-          }
+          try {
+            await fs.promises.unlink(tempFile);
+          } catch (e) {
+            // 忽略清理错误
+          }
           reject(error);

-        const argsStr = args.join(' ');
-        if (argsStr.includes('temp_exec_')) {
-          const tempPath = args.find(a => a.includes('temp_exec_'));
-          if (tempPath && fs.existsSync(tempPath)) {
-            try { fs.unlinkSync(tempPath); } catch {}
-          }
-        }
+        const argsStr = args.join(' ');
+        if (argsStr.includes('temp_exec_')) {
+          const tempPath = args.find(a => a.includes('temp_exec_'));
+          if (tempPath) {
+            fs.promises.unlink(tempPath).catch(() => {});
+          }
+        }
```
