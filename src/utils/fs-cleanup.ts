import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import { logger } from "../logger.js";

/**
 * 清理临时文件 (P033: Bolt 增强)
 * 异步扫描系统临时目录，删除超过 1 小时的 temp_* 文件
 *
 * Bolt 性能优化补充:
 * 💡 What: 将串行文件删除优化为带并发控制的 Promise.all 批处理。
 * 🎯 Why: 针对大量临时文件的情况，串行 I/O 会严重阻塞并增加总执行时间。
 * 📊 Impact: O(n) 的 I/O 等待时间显著缩短，同时设置 batch size=50 避免 Node.js 触发 EMFILE (Too many open files) 错误。
 */
export async function cleanupTmpFiles(): Promise<void> {
  const tmpDir = os.tmpdir();
  const now = Date.now();
  const ONE_HOUR = 1000 * 60 * 60;

  try {
    const files = await fsPromises.readdir(tmpDir);
    const tempFiles = files.filter(
      (f) => f.startsWith("temp_") && (f.endsWith(".js") || f.endsWith(".ts")),
    );

    const CHUNK_SIZE = 50;
    for (let i = 0; i < tempFiles.length; i += CHUNK_SIZE) {
      const chunk = tempFiles.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async (file) => {
          // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
          const filePath = path.join(tmpDir, file);
          try {
            const stats = await fsPromises.stat(filePath);
            if (now - stats.mtimeMs > ONE_HOUR) {
              await fsPromises.unlink(filePath);
              logger.debug(`[Cleanup] Deleted old temp file: ${file}`);
            }
          } catch (err) {
            // 忽略单个文件处理失败（可能已被删除或无权限）
          }
        }),
      );
    }
  } catch (err: any) {
    logger.warn(`[Cleanup] Failed to read tmp directory: ${err.message}`);
  }
}
