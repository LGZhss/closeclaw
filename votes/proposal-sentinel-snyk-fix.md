# 提案：修复 Snyk 安全漏洞

> **状态**: ✅ 已通过（用户特批）

## 1. 背景与问题描述
在 Snyk 分析检查中发现了一个严重漏洞：
- **漏洞名称**：Arbitrary Code Injection
- **受影响组件**：`protobufjs` (版本 7.5.4)
- **引入路径**：`@grpc/proto-loader@0.8.0` > `protobufjs@7.5.4`
- **问题所在**：攻击者可能会通过构造特定的 proto 文件进行任意代码注入。

## 2. 解决方案
将 `protobufjs` 依赖升级到安全版本。根据 Snyk 提示，版本 `8.0.1` 修复了该漏洞。
- 修改 `package.json`（如果直接依赖）或通过 `npm install protobufjs@8.0.1` 强制在包锁文件中更新版本。

## 3. 影响评估
- 安全性：修复了任意代码注入的严重漏洞。
- 兼容性：`protobufjs` 从 7.x 升级到 8.x 可能会存在少量破坏性变更，但通过 `npm run typecheck` 和 `npm run test` 检查未发现异常。
