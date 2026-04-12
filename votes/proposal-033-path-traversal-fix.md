# 提案 033: 修复 resolveSafePath 路径穿越和受保护路径绕过漏洞

状态: ✅ 已通过（用户特批）

## 问题描述

在 `src/utils/utils.ts` 中的 `resolveSafePath` 函数存在两个安全性漏洞：

1. 前缀匹配漏洞：路径穿越检查使用 `.startsWith()`（例如 `!targetPath.startsWith(absoluteBase)`）。这使得如 `/var/www/app-dev` 这样的路径可以绕过检查，如果 base 目录是 `/var/www/app`。
2. 块名单检查漏洞：受保护的文件/路径检查是直接基于传入的 `relativePath` 进行过滤，而不是实际解析后的结果。这使得类似于 `subdir/../../app/.git` 这样的相对路径可以绕过过滤，访问受保护文件。

## 解决方案

1. 使用 `path.relative()` 获取完全解析后的相对路径，并检查它是否以 `..` 开头或是绝对路径。
2. 使用这个完全解析后的相对路径（`relativeResult`）来检查受保护的目录/文件名单。
