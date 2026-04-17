import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import { logger } from "../logger.js";

/**
 * 清理临时文件 (P033: Bolt 增强)
 * 异步扫描系统临时目录，删除超过 1 小时的 temp_* 文件
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

    // ⚡ Bolt Optimization:
    // What: Process temporary file stats and deletions concurrently in chunks (e.g. 50 files at a time).
    // Why: Previously, a sequential for...of loop waited for each stat/unlink operation to finish before starting the next. An unbounded Promise.all could trigger EMFILE (too many open files) limits.
    // Impact: Eliminates sequential I/O blocking while remaining safe from OS file limits, reducing execution time significantly for large directories.
    const chunkSize = 50;
    for (let i = 0; i < tempFiles.length; i += chunkSize) {
      const chunk = tempFiles.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (file) => {
          // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
          const filePath = path.join(tmpDir, file);
          try {
            const stats = await fsPromises.stat(filePath);
            if (now - stats.mtimeMs > ONE_HOUR) {
              await fsPromises.unlink(filePath);
              logger.debug(`[Cleanup] Deleted old temp file: ${file}`);
            }
          } catch (err) {
            // 忽略单个文件处理失败（可能已被删除）
          }
        }),
      );
    }
  } catch (err: any) {
    logger.warn(`[Cleanup] Failed to read tmp directory: ${err.message}`);
  }
}
