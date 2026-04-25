# 提案：修复可预测的 executionId 生成漏洞

**状态：** ✅ 已通过（用户特批）

**问题描述：**
在 `ProcessExecutor` 中，使用 `Math.random()` 生成的 `executionId` 是可预测的，缺乏加密安全性。这可能导致标识符冲突或跨执行的潜在操纵风险。

**解决方案：**
将 `src/sandbox/process-executor.ts` 中所有使用 `Math.random().toString(36)` 生成 `executionId` 的地方替换为 `crypto.randomBytes(8).toString("hex")`。
