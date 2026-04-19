# Proposal: Secure Random Number Generation

状态: ✅ 已通过（用户特批）

## 问题描述
`ProcessExecutor` 类使用不安全的 `Math.random()` 来生成任务执行 ID（executionId）。这种生成方式是可预测的，可能导致 ID 冲突，带来越权操作等潜在的安全风险。

## 解决方案
使用 `crypto.randomBytes(6).toString("hex")` 替代 `Math.random().toString(36).substring(2, 11)`，确保 executionId 的生成具备密码学安全性（CSPRNG）。

## 影响范围
- `src/sandbox/process-executor.ts` 中的 `executionId` 生成逻辑。
