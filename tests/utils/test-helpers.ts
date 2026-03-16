/**
 * tests/utils/test-helpers.ts
 * 通用测试辅助函数（提案 015）
 * 实施主体: Verdent (Claude Sonnet 4.6)
 */

/** 等待指定毫秒数 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 带超时的条件轮询，超时抛出错误 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 50,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await sleep(intervalMs);
  }
  throw new Error(`waitFor 超时（${timeoutMs}ms）`);
}

/** 断言 Promise 会 reject（包含可选的错误信息检查） */
export async function expectReject(
  fn: () => Promise<unknown>,
  expectedMessage?: string | RegExp,
): Promise<Error> {
  try {
    await fn();
    throw new Error('期望 Promise reject，但它 resolved 了');
  } catch (e) {
    const err = e as Error;
    if (expectedMessage) {
      const msg = err.message ?? String(err);
      if (typeof expectedMessage === 'string') {
        if (!msg.includes(expectedMessage)) {
          throw new Error(`错误信息 "${msg}" 不包含预期文本 "${expectedMessage}"`);
        }
      } else {
        if (!expectedMessage.test(msg)) {
          throw new Error(`错误信息 "${msg}" 不匹配正则 ${expectedMessage}`);
        }
      }
    }
    return err;
  }
}

/** 将毫秒时间戳格式化为可读字符串（仅用于测试输出） */
export function formatTs(ts: number): string {
  return new Date(ts).toISOString();
}
