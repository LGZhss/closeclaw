# 提案 035: 修复 Git 工具中的命令注入漏洞

> **状态**: ✅ 已通过（用户提出特批）

## 目标


修复 `src/utils/utils.ts` 中的 `runGit` 和 `isGitRepo` 方法中存在的命令注入漏洞。


## 具体变更

1. 将 `isGitRepo` 和 `runGit` 中的 `execSync` 替换为 `execFileSync`。
2. 修改 `execFileSync` 的参数调用方式，避免 shell 执行带来的命令注入风险。
3. 更新相关的测试用例以匹配 `execFileSync` 的使用。
