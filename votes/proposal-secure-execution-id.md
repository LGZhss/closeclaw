# 提案: 修复 ProcessExecutor 中不安全的随机标识符生成

## 状态
✅ 已通过（用户特批）

## 背景
当前 `ProcessExecutor` 中的 `executionId` 是使用 `Math.random()` 生成的。

## 问题
`Math.random()` 是可预测的且在密码学上不安全。在安全敏感的上下文中（如沙箱执行），这可能导致标识符冲突和跨执行操纵风险。

## 解决方案
将 `Math.random()` 替换为 `crypto.randomBytes(8).toString('hex')`，以生成不可预测的、密码学安全的执行标识符。
