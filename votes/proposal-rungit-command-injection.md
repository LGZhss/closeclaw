# 修复 runGit 中的命令注入漏洞

> **状态**: ✅ 已通过（用户特批）

## 问题

`src/utils/utils.ts` 中的 `runGit` 函数使用 `execSync(\`git ${args.join(" ")}\`)`，这会调用 shell 解释器，导致存在命令注入的风险。

## 解决方案

将 `execSync` 替换为 `execFileSync("git", args)`，直接调用二进制文件，避免 shell 元字符解析，从而修复命令注入漏洞。
