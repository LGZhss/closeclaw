/**
 * 内存管理器 - TS 版
 */

import os from "os";

export function getMemoryReport(): string {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const processUsage = process.memoryUsage().rss;

  return `
- 系统总量: ${Math.round(total / 1024 / 1024)}MB
- 系统空闲: ${Math.round(free / 1024 / 1024)}MB
- 系统已用: ${Math.round(used / 1024 / 1024)}MB
- 当前进程: ${Math.round(processUsage / 1024 / 1024)}MB
  `.trim();
}
