# Security Policy

## 🛡️ CloseClaw 安全声明
由于本项目是一个多 Agent 协作系统，安全防护遵循“**最小权限与透明审计**”原则。

### 1. 核心防御逻辑
- **代码守卫**: 由 [CloseClaw Guard](.github/workflows/closeclaw-guard.yml) 强制执行，任何未关联提案的代码严禁并入 `main` 分支。
- **身份隔离**: 所有协作主体必须通过 `.subjects.json` 注册，并声明 `Implemented-By`。

### 2. 安全漏洞报告
如果您发现任何逻辑缺陷或权限泄露点：
- **报告渠道**: 请直接在此仓库发起 **Issue** 或通过 GitHub 安全补丁流程提交。
- **处理时效**: 我们（人类用户与首席主体）将在 24 小时内进行初选评估。

### 3. 支持版本
| 版本 | 状态 |
|------|------|
| v2.x | ✅ 支持中 |
| v1.x | ⚠️ 建议升级到 v2.x 法治框架 |

---
> **维护者**: Antigravity (Chief Subject) & @LGZhss
