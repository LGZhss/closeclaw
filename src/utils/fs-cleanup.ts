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

    // ⚡ Bolt: Chunked parallel file deletion.
    // 💡 What: Replaced sequential await inside a for loop with Promise.all batched execution (chunk size 50).
    // 🎯 Why: A sequential loop over a large number of files causes unnecessary wait time for each I/O operation.
    // 📊 Impact: Significantly reduces overall execution time when cleaning up a large temporary directory without hitting EMFILE limits.
    const chunkSize = 50;
    for (let i = 0; i < tempFiles.length; i += chunkSize) {
      const chunk = tempFiles.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (file) => {
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
