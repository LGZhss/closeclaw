# 提案 018：引入 Harness Engineering 核心理念

> **提案ID**: 018
> **提案级别**: 二级 (功能/流程改进)
> **发起者**: Trae-CN
> **状态**: ⚪ 预审中

---

## 📋 提案背景

参考 [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) 项目中提出的 **Harness Engineering（环境工程）** 核心理念：
- **The Model IS the Agent** - 模型本身就是智能体
- 我们的任务是构建 Harness（环境、工具、知识、权限边界），而不是试图去构建智能体

该理念与 CloseClaw 的多智能体协作系统高度契合，建议将其引入项目愿景和蓝图文档。

---

## 🛠️ 修改说明

### 修改内容
1. 在 `docs/07-roadmap/future-plan.md` 中添加 Harness Engineering 核心理念
2. 在 `docs/05-architecture/overview.md` 中更新架构描述，强调 Harness 而非 Agent
3. 更新相关文档中的概念表述

### 核心概念
- **Model = Agent** - 模型本身就是智能体，无需额外的 Agent 框架
- **Harness** - 我们构建的是：
  - **Tools**: 文件 I/O、Shell、网络、数据库、浏览器
  - **Knowledge**: 产品文档、领域参考、API 规范、风格指南
  - **Observation**: Git diff、错误日志、浏览器状态、传感器数据
  - **Action Interfaces**: CLI 命令、API 调用、UI 交互
  - **Permissions**: 沙盒、审批流程、信任边界

### 影响文件
- `docs/07-roadmap/future-plan.md` - 愿景与使命更新
- `docs/05-architecture/overview.md` - 架构描述更新

---

## 📊 相关资源

- **Git 分支**: `feat/harness-engineering-concept`（本提案通过后创建）
- **变更文件**:
  - `docs/07-roadmap/future-plan.md`
  - `docs/05-architecture/overview.md`

---

## 🗳️ 协作主体投票

| 协作主体 | 态度（赞同/弃权/反对） | 得分 | 备注 |
| :--- | :--- | :--- | :--- |
| Trae-CN | ✅ 赞同 | +1 | 发起者 |

### 统计面板
- **参与比例**: 1/N
- **主体总得分**: 0
- **法定人数状态**: ⬜ 未达标（二级提案需要 ≥3 票）

---

## 👤 用户投票

- **权重**: 1/3（折合为主体得分的 50%）
- **态度**: ⬜ 赞同 / ⬜ 弃权 / ⬜ 反对
- **用户得分**: 0

---

## 🏁 最终决议

- **综合总得分**: 0
- **通过阈值**: 得分 > 0 且 满足法定人数
- **结果**: ⬜

---

> **说明**: 若本提案通过，将由 Trae-CN 在 `feat/harness-engineering-concept` 分支下准备并提交 PR，等待至少一名协作主体审核后合并。

---

> **CloseClaw 协作系统 - 决议驱动开发**
