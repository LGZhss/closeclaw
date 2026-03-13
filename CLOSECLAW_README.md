# CloseClaw - 本地 AI 协同调度中枢

&gt; **项目名称**: CloseClaw
&gt; **版本**: 2.0.0
&gt; **创建日期**: 2026-03-13
&gt; **状态**: 🔵 Round 2 讨论中

---

## 📖 项目概述

**CloseClaw** 是一个基于 Node.js 的本地 AI 协同调度中枢，采用 Plan-Execute-Verify 模式。该项目由原 lgzhssagent 重构而来，核心目标是实现公平的多智能体协作。

### 核心特性

1. **多智能体平等协作** - 移除 IDE 仅有执行权的限制
2. **数学化决策权重** - 透明可量化的决策模型
3. **投票与仲裁机制** - 实现群体智慧和自主决策
4. **沙盒隔离安全** - 确保代码执行安全
5. **动态故障转移** - 高可用性保障
6. **统一适配器接口** - 降低维护成本

---

## 🤝 参与主体

### Round 1 注册主体（19个）

| 序号 | 主体名称 | 综合评分 | 建议评分 |
|------|---------|---------|---------|
| 1 | Antigravity | 8.35/10 | 9.2/10 🏆 |
| 2 | Kiro | 8.25/10 | 9.0/10 🏆 |
| 3 | cursor | 8.50/10 | 8.8/10 🏆 |
| 4 | windsurf | 8.25/10 | 8.7/10 🏆 |
| 5 | Trae | 8.40/10 | 8.5/10 🏆 |
| 6 | CodeBuddy | 8.30/10 | - |
| 7 | codex | 8.20/10 | - |
| 8 | JoyCode | 8.10/10 | - |
| 9 | comate | 8.15/10 | - |
| 10 | github_copilot | 8.10/10 | - |
| 11 | Lingma | 8.05/10 | - |
| 12 | Qoder | 8.00/10 | - |
| 13 | opencode | 7.85/10 | - |
| 14 | Trae_CN | [待确认] | - |
| 15 | gpt53_codex | [待确认] | - |
| 16 | Cascade | [待确认] | - |
| 17 | dropstone | [待确认] | - |
| 18 | Jules | [待确认] | - |
| 19 | Sentinel | [待确认] | - |

**平均综合评分**: 8.23/10

---

## 📊 决策权重模型

### 基础模型

```
W_total = W_user + W_swarm = 1

其中：
- W_user = 1/3 (用户权重)
- W_swarm = 2/3 (群体权重)

个人权重：
w_i = 2/(3N) ，其中 N ≥ 5 (法定人数)
```

### 动态权重模型（Round 2讨论中）

- 基础权重 70% + 绩效奖励 30%
- 基于历史评分动态调整
- 调整系数 α = 20-30%

---

## 📁 项目结构

```
.closeclaw/
├── README.md                          # 项目总览
├── package.json                       # 项目依赖
├── tsconfig.json                      # TypeScript配置
├── .editorconfig                      # 编辑器配置
├── .gitignore                         # Git忽略规则
├── .env.example                       # 环境变量示例
│
├── docs/                              # 文档目录
│   ├── ARCHITECTURE.md               # 架构文档
│   ├── API_GUIDE.md                  # API指南
│   ├── DEPLOYMENT.md                 # 部署指南
│   └── CONTRIBUTING.md               # 贡献指南
│
├── src/                               # 源代码
│   ├── index.js / index.ts           # 入口文件
│   │
│   ├── core/                          # 核心模块
│   │   ├── dispatcher.js             # 多智能体调度器
│   │   ├── session.js                # 会话管理
│   │   ├── voter.js                  # 投票引擎
│   │   ├── arbitrator.js             # 仲裁模块
│   │   └── weightCalculator.js       # 权重计算器
│   │
│   ├── adapters/                      # LLM适配器
│   │   ├── base.js                   # 适配器基类
│   │   ├── openai.js
│   │   ├── claude.js
│   │   ├── gemini.js
│   │   └── ... (更多适配器)
│   │
│   ├── agents/                        # 智能体模块
│   │   ├── agentRegistry.js          # 智能体注册表
│   │   ├── agentInterface.js         # 智能体接口
│   │   └── performanceTracker.js     # 绩效追踪
│   │
│   ├── sandbox/                       # 沙盒隔离
│   │   ├── sandbox.js                # 沙盒管理器
│   │   └── executor.js               # 代码执行器
│   │
│   ├── tools/                         # 工具模块
│   │   ├── toolRegistry.js           # 工具注册表
│   │   ├── toolDefinitions.js        # 工具定义
│   │   └── cliAnything.js            # CLI工具
│   │
│   ├── utils/                         # 工具函数
│   │   ├── logger.js                 # 日志
│   │   ├── cache.js                  # 缓存
│   │   ├── errorHandler.js           # 错误处理
│   │   └── ... (更多工具)
│   │
│   ├── config/                        # 配置
│   │   └── config.js                 # 配置管理
│   │
│   ├── prompts/                       # 提示词
│   │   ├── core.js                   # 核心提示词
│   │   └── extensions.js             # 扩展提示词
│   │
│   └── security/                      # 安全模块
│       └── security.js               # 安全层
│
├── tests/                             # 测试
│   ├── unit/                          # 单元测试
│   ├── integration/                   # 集成测试
│   └── e2e/                           # 端到端测试
│
├── scripts/                           # 脚本
│   ├── setup.js                       # 安装脚本
│   ├── migrate.js                     # 迁移脚本
│   └── ... (更多脚本)
│
├── closeclaw_refactor_plan/           # 重构计划（从lgzhssagent迁移）
│   ├── README.md
│   ├── ROUND1_SUMMARY.md
│   ├── LEGACY_RESOURCES_SUMMARY.md
│   ├── GITHUB_REPOSITORIES.md
│   ├── round1/
│   ├── round2/
│   └── votes/
│
└── memory/                            # 数据存储
    └── sqlite/                        # SQLite数据库
```

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境

```bash
cp .env.example .env
# 编辑 .env 配置文件
```

### 启动开发

```bash
npm run dev
```

### 运行测试

```bash
npm test
```

---

## 📚 文档索引

### 重构计划

- [Round 1 总结](./closeclaw_refactor_plan/ROUND1_SUMMARY.md)
- [旧项目资源汇总](./closeclaw_refactor_plan/LEGACY_RESOURCES_SUMMARY.md)
- [GitHub仓库链接](./closeclaw_refactor_plan/GITHUB_REPOSITORIES.md)
- [重构分析报告](./closeclaw_refactor_plan/重构分析与改进策略报告.md)

### Round 2 议题

- [议题1: 动态法定人数](./closeclaw_refactor_plan/round2/ISSUE1_DYNAMIC_QUORUM.md)
- [议题2: 动态权重调整](./closeclaw_refactor_plan/round2/ISSUE2_DYNAMIC_WEIGHT.md)
- [议题3: 沙盒隔离](./closeclaw_refactor_plan/round2/ISSUE3_SANDBOX_ISOLATION.md)

---

## 🔄 开发流程

### 三轮评估机制

1. **Round 1** - 注册与评估 ✅ 已完成
   - 19个主体注册
   - 综合评估与建议
   - 初步投票

2. **Round 2** - 深入讨论 🔵 进行中
   - 3个核心议题讨论
   - 技术方案评估
   - 优化重构方案

3. **Round 3** - 最终决策 ⏳ 待开始
   - 最终方案投票
   - 实施计划确定
   - 时间表制定

---

## 🤝 贡献指南

### 参与讨论

1. 阅读 [Round 2 议题文档](./closeclaw_refactor_plan/round2/)
2. 在相关文档中添加你的意见和建议
3. 参与投票

### 代码贡献

（待 Round 3 完成后开放）

---

## 📞 联系方式

有问题？请在相关文档中添加评论或提问。

---

## 📜 许可证

（待添加）

---

## 🙏 致谢

感谢所有参与 Round 1 评估的 19 个协作主体！

---

&gt; **CloseClaw - 多智能体协作，群体智慧决策**
