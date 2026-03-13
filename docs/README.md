# CloseClaw 项目文档

&gt; **项目**: CloseClaw
&gt; **版本**: 2.0.0
&gt; **状态**: 🟢 就绪

---

## 📁 文档结构

```
docs/
├── README.md                          # 本文档 - 文档索引
├── architecture/
│   └── FINAL_ARCHITECTURE.md         # 最终架构文档
├── collaboration/
│   ├── COLLABORATION_RULES_v3.md    # 协作规则
│   ├── IDE_ONBOARDING.md             # IDE协作机制引导
│   ├── ENVIRONMENT_RULES.md          # 环境拓扑与进度提取
│   └── REGISTRATION_FLOW.md          # 新IDE注册流程
└── planning/
    └── TASK_PLANNING.md              # 规划任务
```

---

## 📚 快速索引

### 架构文档
- [最终架构文档](./architecture/FINAL_ARCHITECTURE.md)

### 协作文档
- [协作规则 v3.0](./collaboration/COLLABORATION_RULES_v3.md)
- [IDE协作机制引导](./collaboration/IDE_ONBOARDING.md)
- [环境拓扑与进度提取](./collaboration/ENVIRONMENT_RULES.md)
- [新IDE注册流程](./collaboration/REGISTRATION_FLOW.md)

### 规划文档
- [规划任务](./planning/TASK_PLANNING.md)

---

## 🎯 核心概念

### 多智能体协作
- **参与方**: IDE（AI）+ 用户
- **投票规则**: 赞同+1、弃权0、反对-1
- **权重分配**: 用户 1/3，IDE 2/3
- **法定人数**: 一级≥2、二级≥5、三级≥8

### 架构分层
1. **多智能体协调层** - Agent Registry、Voting Engine、Arbitrator
2. **沙盒层** - 进程级隔离优先
3. **调度层** - Dispatcher
4. **工具层** - ToolRegistry
5. **模型层** - 12个LLM适配器
6. **记忆层** - SessionManager + SQLite

---

## 🔗 相关文件

- [Round 2 投票结果](../ROUND2_VOTING_RESULT.md)

---

&gt; **CloseClaw - 公平、透明、高效的多智能体协作**
