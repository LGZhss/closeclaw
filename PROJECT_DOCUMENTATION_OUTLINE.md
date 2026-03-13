# CloseClaw 重构项目文档大纲

> **项目名称**: CloseClaw 本地 AI 协同调度中枢
> **创建日期**: 2026-03-13
> **状态**: 🟡 Round 1 完成, Round 2 即将开始
> **版本**: 2.0.0

---

## 📖 项目概述

**CloseClaw** 是一个基于 Node.js 的本地 AI 协同调度中枢,采用 Plan-Execute-Verify 模式。本次重构的核心目标是:

1. **移除 IDE 仅有执行权的限制**,实现更公平的多智能体协作
2. **引入数学模型定义决策权重**,确保决策过程透明可量化
3. **建立投票与仲裁机制**,实现群体智慧和自主决策
4. **优化代码架构**,降低维护成本
5. **提升系统性能**,改善用户体验

---

## 📚 文档结构

### 1. 项目根目录

```
.closeclaw/
├── README.md                          # 项目总览
├── 重构分析与改进策略报告.md          # 完整重构分析
├── GITHUB_REPOSITORIES.md             # GitHub仓库地址记录
├── IDE_CONFIGURATION_SUMMARY.md       # IDE配置完成总结
└── IDE_COMPLETION_REPORT.md           # IDE提示词完成报告
```

---

### 2. essentials/ - 必要文件

```
essentials/
├── cliAnything.js                    # CLI-Anything工具
├── scan_free_models.py               # 免费模型扫描脚本
├── toolRegistry.js                   # 工具注册表
├── toolDefinitions.js                # 工具定义
└── .env.example                      # 环境变量示例
```

**说明**:
- 这些文件是项目运行和开发所必需的核心文件
- 包含工具定义、环境配置和脚本工具

---

### 3. round1/ - 第一轮评估

```
round1/
├── README.md                          # 第一轮说明
├── TEMPLATE_registration.md         # 注册模板
├── TEMPLATE_evaluation.md           # 评估模板
├── TEMPLATE_votes.md                # 投票模板
├── PARTICIPANT_LEDGER.md             # 协作主体注册表
├── {IDE}_registration.md           # 各IDE的注册文件
├── {IDE}_evaluation.md             # 各IDE的评估文件
└── {IDE}_votes.md                  # 各IDE的投票文件
```

**包含的IDE注册文件** (19个):

1. Antigravity_registration.md
2. cursor_registration.md
3. windsurf_registration.md
4. Trae_registration.md
5. Trae_CN_registration.md
6. CodeBuddy_registration.md
7. gpt53_codex_registration.md
8. codex_registration.md
9. comate_registration.md
10. github_copilot_registration.md
11. Lingma_registration.md
12. Qoder_registration.md
13. opencode_registration.md
14. Kiro_registration.md
15. JoyCode_registration.md
16. dropstone_registration.md
17. Jules_registration.md
18. Sentinel_registration.md
19. Cascade_registration.md

**Round 1 完成情况**:
- ✅ 已注册: 19个IDE
- ✅ 已评估: 19个IDE
- ✅ 已投票: 18个IDE (Cascade待投票)
- ✅ 法定人数: 已满足(N=18 ≥ 5)
- ✅ 综合评分: 平均8.23/10

---

### 4. round2/ - 第二轮讨论

```
round2/
├── README.md                          # 第二轮总览
├── ISSUE1_DYNAMIC_QUORUM.md          # 议题1: 动态法定人数
├── ISSUE2_DYNAMIC_WEIGHT.md          # 议题2: 动态权重调整
├── ISSUE3_SANDBOX_ISOLATION.md       # 议题3: 沙盒隔离方案
├── ISSUE4_P1_TASK_DETAIL.md         # 议题4: P1任务细化
├── ISSUE5_TYPESCRIPT_MIGRATION.md   # 议题5: TypeScript迁移
├── OPTIMIZED_REFACTOR_PLAN.md       # 优化后的重构方案
├── ROUND2_DISCUSSION_LOG.md         # Round 2讨论日志
└── ROUND2_VOTES_SUMMARY.md          # Round 2投票汇总
```

**Round 2 核心议题**:

1. **动态法定人数机制设计**
   - 分级法定人数定义(低/中/高影响)
   - 初始引导期降级策略
   - 自动切换触发条件
   - 熔断机制设计

2. **动态权重调整机制设计**
   - 基础权重+绩效奖励混合模型
   - 历史评分收集和归一化
   - 调整系数α确定(20-30%)
   - 归一化算法实现

3. **沙盒隔离技术方案评估**
   - `isolated-vm`兼容性测试
   - 替代方案对比评估
   - 最终方案选择
   - 实施计划和风险预案

4. **P1任务细化和时间安排**
   - P1前期/中期任务拆解
   - 性能监控器具体指标
   - 单元测试框架选择
   - 工时调整分配(162h → 200-220h)

5. **TypeScript迁移评估**
   - 成本和收益分析
   - 迁移策略选择
   - 对现有代码影响
   - 是否纳入P2任务

---

### 5. round3/ - 第三轮最终方案

```
round3/
├── README.md                          # 第三轮总览
├── FINAL_REFACTOR_PLAN.md            # 最终重构方案
├── IMPLEMENTATION_PLAN.md            # 实施计划
├── TIMELINE.md                        # 时间表
└── ROUND3_DECISION_LOG.md            # Round 3决策日志
```

**Round 3 目标**:
- 所有IDE讨论Round 2文档
- 敲定最终重构方案
- 确定实施计划和时间表

---

### 6. votes/ - 投票记录

```
votes/
├── ROUND1_VOTES_SUMMARY.md          # Round 1投票汇总
├── ROUND2_VOTES_SUMMARY.md          # Round 2投票汇总
├── ROUND3_VOTES_SUMMARY.md          # Round 3投票汇总
└── FINAL_DECISIONS.md               # 最终决策记录
```

---

### 7. .vscode/ - VS Code配置

```
.vscode/
├── settings.json                     # 工作区设置
├── extensions.json                   # 推荐扩展
├── tasks.json                        # 任务配置
└── launch.json                       # 调试配置
```

**配置内容**:
- 编辑器基础设置(字体、缩进)
- 文件关联和排除规则
- 语言特定设置
- 任务和调试配置
- AI助手集成

---

### 8. IDE配置文件

```
.cursorrules                          # Cursor AI规则配置
.cursorignore                         # Cursor忽略文件配置
.editorconfig                         # 编辑器统一配置
```

**说明**:
- `.cursorrules`: 为Cursor AI提供项目规则和上下文
- `.cursorignore`: 指定Cursor AI应该忽略的文件和目录
- `.editorconfig`: 统一不同编辑器的代码风格

---

### 9. docs/ - 文档目录

```
docs/
├── IDE_PROMPT_GUIDE.md               # IDE协作完整指南
├── IDE_SPECIFIC_GUIDE.md             # IDE特定使用指南
├── AI_AGENT_ONBOARDING.md            # AI助手上岗指南
├── QUICK_REFERENCE.md                # 快速参考手册
├── IDE_CONFIGURATION_SUMMARY.md      # IDE配置完成总结
├── IDE_README_UPDATE.md              # README更新建议
└── IDE_COMPLETION_REPORT.md          # IDE提示词完成报告
```

**文档说明**:

1. **IDE_PROMPT_GUIDE.md** (511行)
   - 快速入门流程
   - 核心约束(不可违反)
   - 必须执行的流程
   - 项目架构理解
   - 工具使用指南
   - 开发规范
   - Agent间协作(A2A)
   - 安全与权限
   - 监控与日志
   - 当前阶段任务

2. **IDE_SPECIFIC_GUIDE.md** (600+行)
   - Cursor使用指南
   - VS Code使用指南
   - JetBrains使用指南
   - Vim/Neovim使用指南
   - IDE切换指南
   - 功能对比表格

3. **AI_AGENT_ONBOARDING.md** (700+行)
   - 快速上岗流程
   - 核心能力清单
   - 绝对禁止的行为
   - 标准工作流程
   - 与人类开发者协作
   - 工作质量标准
   - 常见场景处理
   - 持续改进机制

4. **QUICK_REFERENCE.md** (400+行)
   - 快速开始指南
   - Git常用命令
   - GitNexus常用命令
   - npm常用命令
   - Node.js常用命令
   - 项目特定命令
   - IDE特定快捷键
   - 调试技巧
   - 性能监控
   - 常见问题解答

---

### 10. scripts/ - 脚本工具

```
scripts/
├── setup-ide.sh                     # Linux/Mac环境配置脚本
└── setup-ide.bat                    # Windows环境配置脚本
```

**脚本功能**:
- 自动检测系统信息
- 安装Node.js依赖
- 检查/安装GitNexus
- 创建必要目录
- 检查配置文件
- 语法检查
- Git配置
- 环境变量检查

---

## 📊 文档统计

### 文件数量统计

| 类别 | 数量 | 总行数 |
|------|------|--------|
| 配置文件 | 8个 | ~370行 |
| 文档文件 | 13个 | ~4,500行 |
| 脚本文件 | 2个 | ~210行 |
| 注册/评估/投票 | 57个 | ~15,000行 |
| 议题讨论 | 5个(待创建) | - |
| **总计** | **85+** | **~20,080+行** |

### 参与主体统计

| 轮次 | 已注册 | 已评估 | 已投票 | 平均评分 |
|------|--------|--------|--------|----------|
| Round 1 | 19 | 19 | 18 | 8.23/10 |
| Round 2 | 19(待) | - | - | - |
| Round 3 | 19(待) | - | - | - |

---

## 🎯 文档使用指南

### 对于新用户

1. **快速开始**
   - 阅读 `README.md` 了解项目
   - 阅读 `重构分析与改进策略报告.md` 了解重构内容
   - 查阅 `QUICK_REFERENCE.md` 快速上手

2. **配置IDE**
   - 运行 `scripts/setup-ide.bat` (Windows)
   - 运行 `scripts/setup-ide.sh` (Linux/Mac)
   - 阅读 `docs/IDE_SPECIFIC_GUIDE.md` 了解IDE配置

### 对于AI助手

1. **快速上岗**
   - 阅读 `docs/AI_AGENT_ONBOARDING.md`
   - 阅读 `.cursorrules`
   - 阅读 `docs/IDE_PROMPT_GUIDE.md`

2. **参与评估**
   - 阅读 `round1/README.md` 了解第一轮任务
   - 使用模板创建注册、评估、投票文件
   - 提交文件到 `round1/` 文件夹

### 对于开发者

1. **理解架构**
   - 阅读 `docs/IDE_PROMPT_GUIDE.md` 第3节"项目架构理解"
   - 阅读 `重构分析与改进策略报告.md` 第2节"当前问题分析"

2. **参与讨论**
   - 阅读 `round2/` 目录中的议题讨论文档
   - 在议题文档中发表意见和建议
   - 参与最终方案的投票

---

## 🔄 文档更新流程

### Round 1 完成后(已完成)

1. ✅ 创建 `PARTICIPANT_LEDGER.md` - 协作主体注册表
2. ✅ 创建 `ROUND1_VOTES_SUMMARY.md` - Round 1投票汇总
3. ✅ 创建 `round2/README.md` - Round 2规划
4. ✅ 创建 `GITHUB_REPOSITORIES.md` - GitHub地址记录

### Round 2 进行中(待开始)

1. ⏳ 创建5个核心议题的讨论文档
2. ⏳ 所有IDE参与讨论和投票
3. ⏳ 生成优化后的重构方案
4. ⏳ 创建 `ROUND2_VOTES_SUMMARY.md`

### Round 3 进行中(待开始)

1. ⏳ 创建 `FINAL_REFACTOR_PLAN.md` - 最终重构方案
2. ⏳ 创建 `IMPLEMENTATION_PLAN.md` - 实施计划
3. ⏳ 创建 `TIMELINE.md` - 时间表
4. ⏳ 所有IDE最终投票

---

## 📈 文档质量标准

### 完整性

- ✅ 覆盖所有主流IDE(Cursor, VS Code, JetBrains, Vim)
- ✅ 包含所有必要的配置文件
- ✅ 提供详细的文档说明
- ✅ 包含自动化脚本

### 实用性

- ✅ 一键配置环境
- ✅ 快速参考手册
- ✅ 常用命令速查
- ✅ 故障排除指南

### 专业性

- ✅ 符合最佳实践
- ✅ 遵循开发规范
- ✅ 包含安全准则
- ✅ 提供协作协议

### 可维护性

- ✅ 结构清晰的文档
- ✅ 版本化管理
- ✅ 易于更新和扩展
- ✅ 完整的引用链接

---

## 🎯 下一步行动

### 立即行动

1. ✅ 完成第一轮投票汇总
2. ✅ 创建GitHub地址记录
3. ✅ 创建第二轮规划文档
4. ✅ 迁移文件到`.closeclaw`目录
5. ⏳ 创建项目文档大纲(本文档)

### 短期行动(Round 2期间)

1. 创建5个核心议题的讨论文档
2. 所有IDE参与讨论和投票
3. 生成优化后的重构方案
4. 创建Round 2投票汇总

### 中期行动(Round 2后)

1. 创建Round 3文档
2. 敲定最终方案
3. 确定实施计划和时间表
4. 开始实施

---

## 📞 联系与支持

### 有问题?

1. **对于IDE**: 在评估或投票文件中使用 `[提问]` 标签
2. **对于用户**: 直接在相关文档中回复
3. **紧急问题**: 在主README中添加评论或提问

### 文档位置

- 项目总览: `README.md`
- 重构分析: `重构分析与改进策略报告.md`
- Round 1: `round1/`
- Round 2: `round2/`
- Round 3: `round3/`
- 投票汇总: `votes/`

---

## 📜 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-12 | 创建重构计划框架 |
| 2.0.0 | 2026-03-13 | 完成Round 1,开始Round 2 |

---

## ⚠️ 重要提示

1. **CloseClaw 命名**: 项目已从 lgzhssagent 重命名为 **CloseClaw**
2. **多智能体协作**: 所有IDE都是平等的协作主体,不再有执行权限制
3. **决策权重**: 采用数学模型定义权重,确保公平透明
4. **投票机制**: 所有关键决策都需要通过投票确定
5. **三轮评估**: 所有IDE必须参与三轮评估流程

---

> **欢迎使用 CloseClaw 多智能体协作系统!**
> 本文档大纲提供了项目的完整结构和使用指南,帮助您快速了解和参与项目。
