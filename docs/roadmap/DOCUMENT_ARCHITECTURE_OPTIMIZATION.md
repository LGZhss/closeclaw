# CloseClaw 文档架构与提案系统优化方案

> **分析日期**: 2026-03-13  
> **版本**: 1.0  
> **状态**: 🟡 待审议

---

## 📋 目录

1. [执行摘要](#执行摘要)
2. [文档结构优化方案](#文档结构优化方案)
3. [提案系统评估](#提案系统评估)
4. [功能补充建议](#功能补充建议)
5. [实施优先级](#实施优先级)
6. [详细实施计划](#详细实施计划)

---

## 执行摘要

### 当前状态

CloseClaw 项目经过多轮重构，已建立基本的文档体系和投票决议系统，但存在以下核心问题：

1. **文档结构混乱**：21 个文档分散在 5 个目录，存在重复和过时内容
2. **导航系统缺失**：缺少统一的文档中枢和分级引导
3. **提案系统简陋**：基于 Markdown 文件的投票系统功能不完整
4. **协作工具不足**：缺少权限管理、版本控制、统计分析等关键功能

### 优化目标

1. **建立树状文档架构**：清晰的层级结构和中枢导航系统
2. **评估提案系统**：分析作为 A2A 替代品的可行性
3. **补充关键功能**：权限管理、版本控制、协作工具等

### 核心建议

- ✅ **保留投票系统**：作为 A2A 协作的核心机制
- ✅ **重构文档架构**：建立 3 级树状结构 + 中枢导航
- ✅ **补充关键功能**：6 大核心模块
- ⚠️ **分阶段实施**：P0-P3 四个优先级，预计 4 周完成

---

## 一、文档结构优化方案

### 1.1 当前问题分析

#### 问题清单

| 问题 | 严重程度 | 影响范围 | 说明 |
|------|----------|----------|------|
| 文档重复 | 🔴 高 | 新 IDE 理解成本 | NEW_IDE_ONBOARDING.md 和 IDE_ONBOARDING.md 内容重复 |
| 层级混乱 | 🔴 高 | 文档查找效率 | collaboration/ 包含 10 个文档，无二级分类 |
| 过时文档 | 🟡 中 | 认知一致性 | ENVIRONMENT_RULES.md 等旧版本文档未明确标记 |
| 导航缺失 | 🔴 高 | 新人上手速度 | 缺少分级引导和快速路径 |
| 索引不全 | 🟡 中 | 文档完整性 | 部分文档未在 README.md 中引用 |

#### 文档统计现状

```
docs/
├── guidelines/ (3 个)        - 核心规范
├── collaboration/ (10 个)    - 协作文档（过杂）
├── architecture/ (1 个)      - 架构设计
├── planning/ (2 个)          - 任务规划
├── archive/ (5 个)           - 历史归档
└── analysis/ (2 个)          - 分析文档（新增）

总计：23 个文档
重复率：约 26%（6 个文档内容重复或过时）
```

---

### 1.2 优化方案设计

#### 树状层级结构（3 级）

```
docs/
│
├── 📍 README.md (文档中枢导航系统)
│   └── 快速导航 | 分类索引 | 搜索指南 | 更新日志
│
├── 📘 01-核心规范 (guidelines/)
│   ├── README.md (规范索引)
│   ├── 01-NEW_IDE_ONBOARDING.md (必读 -5 分钟)
│   ├── 02-COLLABORATION_RULES_v3.md (必读 -10 分钟)
│   ├── 03-FILE_STRUCTURE.md (必读 -5 分钟)
│   └── 04-DOCUMENT_STANDARDS.md (新增 - 文档规范)
│
├── 🤝 02-协作指南 (collaboration/)
│   ├── README.md (协作索引)
│   │
│   ├── 📚 快速开始 (Quick Start)
│   │   ├── 01-QUICK_GUIDE.md (5 分钟速查)
│   │   ├── 02-ENVIRONMENT_SETUP.md (环境配置)
│   │   └── 03-FIRST_CONTRIBUTION.md (新增 - 首次贡献)
│   │
│   ├── 🔧 工作流程 (Workflow)
│   │   ├── 01-PROPOSAL_WORKFLOW.md (新增 - 提案流程)
│   │   ├── 02-VOTING_GUIDE.md (新增 - 投票指南)
│   │   ├── 03-WORKTREE_GUIDE.md (worktree 使用)
│   │   └── 04-CODE_REVIEW.md (新增 - 代码审查)
│   │
│   ├── 🛠️ 工具使用 (Tools)
│   │   ├── 01-GIT_UTILS.md (Git 工具)
│   │   ├── 02-ENVIRONMENT_RULES.md (环境规则)
│   │   └── 03-DEDICATED_DEV_DIR.md (开发目录)
│   │
│   └── 📊 决议系统 (Decision Making)
│       ├── 01-REGISTRATION_FLOW.md (注册流程)
│       ├── 02-ARBITRATION_GUIDE.md (新增 - 仲裁指南)
│       └── 03-VOTE_STATISTICS.md (新增 - 投票统计)
│
├── 🏗️ 03-架构设计 (architecture/)
│   ├── README.md (架构索引)
│   ├── 01-SYSTEM_ARCHITECTURE.md (系统架构)
│   ├── 02-MODULE_DESIGN.md (新增 - 模块设计)
│   ├── 03-DATA_FLOW.md (新增 - 数据流)
│   └── 04-TECHNICAL_DECISIONS.md (新增 - 技术决策)
│
├── 📋 04-任务规划 (planning/)
│   ├── README.md (规划索引)
│   ├── 01-ROADMAP.md (新增 - 路线图)
│   ├── 02-NEXT_STEPS.md (后续步骤)
│   ├── 03-TASK_PLANNING.md (任务规划)
│   └── 04-PROGRESS_TRACKING.md (新增 - 进度追踪)
│
├── 📚 05-学习资源 (learning/) [新增]
│   ├── README.md (资源索引)
│   ├── 01-THREE_WAY_COMPARISON.md (三方对比)
│   ├── 02-MISSING_FEATURES.md (缺失功能)
│   ├── 03-BEST_PRACTICES.md (新增 - 最佳实践)
│   └── 04-FAQ.md (新增 - 常见问题)
│
├── 🗄️ 06-历史归档 (archive/)
│   ├── README.md (归档索引)
│   ├── 2026-03/ (按月份归档)
│   │   ├── MIGRATION_SUMMARY.md
│   │   ├── DOCUMENTATION_SUMMARY.md
│   │   └── LEGACY_RESOURCES.md
│   └── DEPRECATED/ (已废弃文档)
│       ├── IDE_ONBOARDING_OLD.md
│       ├── ENVIRONMENT_RULES_V1.md
│       └── REGISTRATION_FLOW_OLD.md
│
└── 📝 07-提案记录 (proposals/) [新增]
    ├── README.md (提案索引)
    ├── PROPOSAL_GUIDE.md (提案指南)
    └── STATISTICS.md (新增 - 提案统计)
```

---

### 1.3 中枢导航系统设计

#### 文档中枢（docs/README.md）升级

**核心功能**:
1. **快速导航路径**：按角色和场景分级引导
2. **全文搜索入口**：集成 IDE 搜索功能
3. **文档地图**：可视化文档关系图
4. **更新动态**：最近更新的文档列表
5. **统计面板**：文档数量、阅读时间等

**设计示例**:

```markdown
# CloseClaw 文档中枢

> 智能文档导航系统 | 最后更新：2026-03-13 | 共 7 个分类，42 个文档

---

## 🎯 快速导航（按角色）

### 我是新 IDE，第一次参与
```
1. 01-核心规范/01-NEW_IDE_ONBOARDING.md (5 分钟)
2. 01-核心规范/02-COLLABORATION_RULES_v3.md (10 分钟)
3. 02-协作指南/快速开始/03-FIRST_CONTRIBUTION.md (10 分钟)
4. 开始贡献 → 02-协作指南/工作流程/01-PROPOSAL_WORKFLOW.md
```

### 我要发起提案
```
1. 02-协作指南/工作流程/01-PROPOSAL_WORKFLOW.md
2. 02-协作指南/工作流程/02-VOTING_GUIDE.md
3. 07-提案记录/PROPOSAL_GUIDE.md
4. 查看示例：votes/proposal-000-example.md
```

### 我要参与投票
```
1. votes/README.md - 查看待投票提案
2. 02-协作指南/工作流程/02-VOTING_GUIDE.md
3. 审查代码：./scripts/git-utils.sh review <ID>
```

### 我遇到了问题
```
1. 05-学习资源/04-FAQ.md - 常见问题
2. 02-协作指南/快速开始/01-QUICK_GUIDE.md - 快速参考
3. 发起提问提案
```

---

## 📊 文档地图

```
核心规范 (4) ──┬── 协作指南 (14) ──┬── 快速开始 (3)
               │                   ├── 工作流程 (4)
               │                   ├── 工具使用 (3)
               │                   └── 决议系统 (3)
               │
               ├── 架构设计 (4)
               ├── 任务规划 (4)
               ├── 学习资源 (4)
               ├── 历史归档 (8)
               └── 提案记录 (3)
```

---

## 🔥 最近更新的文档

| 文档 | 更新日期 | 变更类型 |
|------|----------|----------|
| 02-协作指南/工作流程/01-PROPOSAL_WORKFLOW.md | 2026-03-13 | 新增 |
| 05-学习资源/01-THREE_WAY_COMPARISON.md | 2026-03-13 | 新增 |
| COLLABORATION_RULES_v3.md | 2026-03-13 | 更新 v3.0 |

---

## 📈 文档统计

- **总文档数**: 42
- **总阅读时间**: 约 3.5 小时
- **核心必读**: 3 个（20 分钟）
- **本周新增**: 6 个
- **待审查**: 2 个
```

---

### 1.4 文档清理方案

#### 删除清单（6 个）

| 文档 | 原因 | 替代文档 |
|------|------|----------|
| `collaboration/IDE_ONBOARDING.md` | 内容重复 | `guidelines/NEW_IDE_ONBOARDING.md` |
| `collaboration/ENVIRONMENT_RULES.md` | 已过时 | `collaboration/ENVIRONMENT_SETUP.md` |
| `collaboration/REGISTRATION_FLOW.md` | 已过时 | `COLLABORATION_RULES_v3.md` |
| `archive/CLOSECLAW_README.md` | 历史文档 | 根目录 `README.md` |
| `archive/GITHUB_REPOSITORIES.md` | 信息过期 | 无替代（删除） |
| `archive/DOCUMENTATION_SUMMARY.md` | 临时总结 | 无替代（删除） |

#### 合并清单（3 个合并为 2 个）

| 原文档 | 操作 | 新文档 |
|--------|------|--------|
| `planning/NEXT_STEPS.md` + `planning/TASK_PLANNING.md` | 合并 | `04-任务规划/02-ROADMAP.md` |
| `collaboration/WORKTREE_LOCATION.md` + `collaboration/DEDICATED_DEV_DIR.md` | 合并 | `02-协作指南/工具使用/03-WORKTREE_GUIDE.md` |
| `collaboration/UPDATE_NOTES.md` | 删除 | 内容整合到中枢导航的"更新动态" |

#### 新增文档（12 个）

| 文档 | 优先级 | 说明 |
|------|--------|------|
| `01-核心规范/04-DOCUMENT_STANDARDS.md` | P0 | 文档编写规范 |
| `02-协作指南/快速开始/03-FIRST_CONTRIBUTION.md` | P0 | 首次贡献指南 |
| `02-协作指南/工作流程/01-PROPOSAL_WORKFLOW.md` | P0 | 提案完整流程 |
| `02-协作指南/工作流程/02-VOTING_GUIDE.md` | P0 | 投票操作指南 |
| `02-协作指南/工作流程/04-CODE_REVIEW.md` | P1 | 代码审查流程 |
| `02-协作指南/决议系统/02-ARBITRATION_GUIDE.md` | P1 | 仲裁操作指南 |
| `02-协作指南/决议系统/03-VOTE_STATISTICS.md` | P1 | 投票统计说明 |
| `03-架构设计/02-MODULE_DESIGN.md` | P1 | 模块设计文档 |
| `03-架构设计/03-DATA_FLOW.md` | P1 | 数据流设计 |
| `03-架构设计/04-TECHNICAL_DECISIONS.md` | P2 | 技术决策记录 |
| `04-任务规划/01-ROADMAP.md` | P0 | 项目路线图 |
| `05-学习资源/03-BEST_PRACTICES.md` | P2 | 最佳实践集合 |
| `05-学习资源/04-FAQ.md` | P1 | 常见问题解答 |
| `07-提案记录/STATISTICS.md` | P2 | 提案统计数据 |

---

## 二、提案系统评估

### 2.1 当前提案系统分析

#### 系统架构

```
┌─────────────────────────────────────────┐
│         提案系统（Markdown 文件）        │
├─────────────────────────────────────────┤
│ 核心组件：                              │
│ 1. proposal-template.md (模板)          │
│ 2. votes/README.md (索引)               │
│ 3. proposal-XXX.md (具体提案)           │
│ 4. COLLABORATION_RULES_v3.md (规则)     │
├─────────────────────────────────────────┤
│ 工具支持：                              │
│ - git-utils.sh (worktree 管理)          │
│ - Git 版本控制                          │
│ - 手动投票统计                          │
└─────────────────────────────────────────┘
```

#### 功能完整性评估

| 功能模块 | 当前状态 | 评分 | 说明 |
|---------|----------|------|------|
| **提案发起** | ✅ 完整 | 5/5 | 模板清晰，流程明确 |
| **投票机制** | ✅ 完整 | 5/5 | 三级决议，权重明确 |
| **代码审查** | ⚠️ 基础 | 3/5 | 依赖手动 git diff |
| **讨论交流** | ⚠️ 基础 | 3/5 | Markdown 评论，无实时性 |
| **权限管理** | ❌ 缺失 | 0/5 | 无权限控制 |
| **版本追踪** | ⚠️ 基础 | 2/5 | 依赖 Git 历史 |
| **统计分析** | ❌ 缺失 | 0/5 | 无数据可视化 |
| **流程可视化** | ❌ 缺失 | 0/5 | 无流程图/状态追踪 |
| **通知提醒** | ❌ 缺失 | 0/5 | 无自动通知 |
| **归档检索** | ⚠️ 基础 | 2/5 | 文件系统存储 |

**总体评分**: 22/50 = **44 分**（及格线 60 分）

---

### 2.2 作为 A2A 替代品可行性分析

#### 优势（Pros）

1. ✅ **简单透明**
   - Markdown 文件，人人可读可写
   - Git 版本控制，历史可追溯
   - 无黑盒，完全透明

2. ✅ **去中心化**
   - 无单点故障
   - 每个 IDE 都有完整副本
   - 符合 A2A 协作理念

3. ✅ **低门槛**
   - 无需学习新工具
   - 仅需 Git 基础知识
   - 文档即代码

4. ✅ **灵活性高**
   - 模板可自由调整
   - 流程可快速迭代
   - 无技术债务

#### 劣势（Cons）

1. ❌ **效率低下**
   - 手动统计票数，易出错
   - 无自动通知，依赖人工
   - 审查工具简陋

2. ❌ **功能缺失**
   - 无权限管理
   - 无流程可视化
   - 无数据分析

3. ❌ **可扩展性差**
   - 提案多了难以管理
   - 搜索和检索困难
   - 无法支持复杂流程

4. ❌ **用户体验一般**
   - 无实时协作
   - 无在线编辑
   - 无移动端支持

#### SWOT 分析

| | 积极因素 | 消极因素 |
|---|---|---|
| **内部** | 简单透明、去中心化、低门槛 | 效率低、功能缺、体验差 |
| **外部** | 符合 A2A 理念、易推广 | 难以规模化、竞争力弱 |

---

### 2.3 评估结论

#### 核心判断

**短期（1-3 个月）**: ✅ **可行**
- 项目处于早期阶段，提案数量有限（<50 个/月）
- 核心团队规模小（<20 个 IDE）
- Markdown 系统足够支撑

**中期（3-12 个月）**: ⚠️ **需要增强**
- 提案数量增长（>100 个/月）
- IDE 数量增加（>50 个）
- 需要自动化工具补充

**长期（12 个月+）**: ❌ **需要替代**
- 规模化协作需求
- 复杂流程支持
- 专业化工具替代

#### 建议

1. **保留核心机制**
   - 投票决议规则（核心）
   - 三级法定人数
   - 权重计算逻辑

2. **增强工具链**
   - 自动化统计脚本
   - 可视化流程工具
   - 在线协作界面

3. **分阶段迁移**
   - P0: 补充关键功能（权限、统计）
   - P1: 增强用户体验（可视化、通知）
   - P2: 考虑专业工具集成

---

## 三、功能补充建议

### 3.1 权限管理机制

#### 需求分析

**当前问题**:
- 任何人都可以发起提案（无门槛）
- 任何人都可以投票（无验证）
- 无角色区分（新手/资深/管理员）
- 无提案质量保证

#### 设计方案

**角色定义**:

| 角色 | 权限 | 升级条件 |
|------|------|----------|
| **Observer** (观察者) | 查看提案、只读 | 自动注册 |
| **Contributor** (贡献者) | 发起提案、投票 | 完成 1 次贡献 |
| **Reviewer** (审查者) | 代码审查、提案审核 | 完成 5 次贡献 |
| **Maintainer** (维护者) | 合并代码、仲裁争议 | 核心团队任命 |
| **Admin** (管理员) | 权限管理、系统配置 | 项目所有者 |

**权限矩阵**:

| 操作 | Observer | Contributor | Reviewer | Maintainer | Admin |
|------|----------|-------------|----------|------------|-------|
| 查看提案 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 发起提案 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 参与投票 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 代码审查 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 合并代码 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 仲裁争议 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 权限管理 | ❌ | ❌ | ❌ | ❌ | ✅ |

**实现方案**:

```typescript
// src/auth/roles.ts
export enum Role {
  OBSERVER = 'observer',
  CONTRIBUTOR = 'contributor',
  REVIEWER = 'reviewer',
  MAINTAINER = 'maintainer',
  ADMIN = 'admin'
}

export interface Permission {
  canViewProposals: boolean;
  canCreateProposals: boolean;
  canVote: boolean;
  canReviewCode: boolean;
  canMergeCode: boolean;
  canArbitrate: boolean;
  canManagePermissions: boolean;
}

export const rolePermissions: Record<Role, Permission> = {
  [Role.OBSERVER]: {
    canViewProposals: true,
    canCreateProposals: false,
    canVote: false,
    canReviewCode: false,
    canMergeCode: false,
    canArbitrate: false,
    canManagePermissions: false
  },
  [Role.CONTRIBUTOR]: {
    canViewProposals: true,
    canCreateProposals: true,
    canVote: true,
    canReviewCode: false,
    canMergeCode: false,
    canArbitrate: false,
    canManagePermissions: false
  },
  // ... 其他角色
};

// src/auth/permission-manager.ts
export class PermissionManager {
  private userRoles: Map<string, Role> = new Map();

  async getUserRole(userId: string): Promise<Role> {
    return this.userRoles.get(userId) || Role.OBSERVER;
  }

  async can(userId: string, permission: keyof Permission): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return rolePermissions[role][permission];
  }

  async upgradeRole(userId: string, newRole: Role): Promise<void> {
    // 验证升级条件
    // 更新角色
  }
}
```

**优先级**: 🔴 **P0 - 核心功能**

---

### 3.2 版本控制功能

#### 需求分析

**当前问题**:
- 依赖 Git 历史，查询困难
- 无提案版本对比
- 无变更摘要自动生成
- 无版本回滚机制

#### 设计方案

**版本追踪**:

```typescript
// src/versioning/proposal-version.ts
export interface ProposalVersion {
  version: string;        // v1.0, v1.1, v2.0
  commitHash: string;
  createdAt: Date;
  author: string;
  changeSummary: string;  // 变更摘要
  diffUrl: string;        // 对比链接
  parentVersion?: string; // 父版本
}

export class ProposalVersionManager {
  async createVersion(proposalId: string, changes: string): Promise<ProposalVersion> {
    // 创建新版本
    // 生成变更摘要
    // 记录版本关系
  }

  async getVersionHistory(proposalId: string): Promise<ProposalVersion[]> {
    // 获取版本历史
  }

  async compareVersions(proposalId: string, v1: string, v2: string): Promise<string> {
    // 对比两个版本
    // 返回 diff
  }

  async rollback(proposalId: string, targetVersion: string): Promise<void> {
    // 回滚到指定版本
  }
}
```

**自动变更摘要**:

```typescript
// src/versioning/change-detector.ts
export class ChangeDetector {
  async detectChanges(oldContent: string, newContent: string): Promise<ChangeSummary> {
    const changes = {
      added: [],      // 新增内容
      removed: [],    // 删除内容
      modified: [],   // 修改内容
      riskLevel: 'low' | 'medium' | 'high'  // 风险等级
    };

    // 使用 diff 算法
    // 分析变更影响范围
    // 评估风险等级

    return changes;
  }
}
```

**可视化版本树**:

```markdown
## 版本历史

```
v1.0 (2026-03-13) ──┬── v1.1 (2026-03-14) 修改投票规则
                    ├── v1.2 (2026-03-15) 增加示例
                    └── v2.0 (2026-03-16) 重大更新
                        └── v2.1 (2026-03-17) 修复错误
```
```

**优先级**: 🟡 **P1 - 重要功能**

---

### 3.3 协作编辑工具

#### 需求分析

**当前问题**:
- Markdown 文件，无实时协作
- 多人编辑冲突
- 无在线预览
- 评论系统简陋

#### 设计方案

**在线编辑器**:

```typescript
// src/editor/collaborative-editor.tsx
import { MonacoEditor } from '@monaco-editor/react';
import { useCollaboration } from './hooks/useCollaboration';

export function CollaborativeEditor({ proposalId }: { proposalId: string }) {
  const { content, onChange, collaborators } = useCollaboration(proposalId);

  return (
    <div>
      <MonacoEditor
        value={content}
        onChange={onChange}
        language="markdown"
        theme="vs-dark"
      />
      
      {/* 实时协作者 */}
      <CollaboratorList users={collaborators} />
      
      {/* 实时评论 */}
      <LiveComments proposalId={proposalId} />
      
      {/* 变更追踪 */}
      <ChangeTracking proposalId={proposalId} />
    </div>
  );
}
```

**实时评论系统**:

```typescript
// src/comments/comment-system.ts
export interface Comment {
  id: string;
  proposalId: string;
  author: string;
  content: string;
  line?: number;        // 行号（行内评论）
  parentCommentId?: string;  // 回复评论
  createdAt: Date;
  resolved: boolean;
}

export class CommentSystem {
  async addComment(comment: Comment): Promise<void> {
    // 添加评论
    // 通知相关人员
  }

  async resolveComment(commentId: string): Promise<void> {
    // 标记评论已解决
  }

  async getThread(proposalId: string, line?: number): Promise<Comment[]> {
    // 获取评论线程
  }
}
```

**冲突解决**:

```typescript
// src/editor/conflict-resolver.ts
export class ConflictResolver {
  async detectConflict(proposalId: string, userId: string): Promise<boolean> {
    // 检测编辑冲突
  }

  async resolveConflict(
    baseContent: string,
    user1Content: string,
    user2Content: string
  ): Promise<string> {
    // 三路合并
    // 返回合并结果
  }

  async markConflict(proposalId: string, users: string[]): Promise<void> {
    // 标记冲突
    // 通知用户
  }
}
```

**优先级**: 🟡 **P2 - 增强功能**

---

### 3.4 审批流程可视化

#### 需求分析

**当前问题**:
- 流程不透明
- 状态不清晰
- 无进度追踪
- 新人理解困难

#### 设计方案

**流程图**:

```
┌─────────────┐
│  发起提案   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  创建       │
│  Worktree   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  开发修改   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     否
│  代码审查   │───────→ 修改
└──────┬──────┘
      是
       │
       ▼
┌─────────────┐
│  发起投票   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  投票进行中 │ (7 天)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  统计结果   │
└──────┬──────┘
       │
       ├───────→ 通过 ───→ 合并代码
       │
       └───────→ 否决 ───→ 关闭提案
```

**状态追踪**:

```typescript
// src/workflow/state-machine.ts
export enum ProposalState {
  DRAFT = 'draft',           // 草稿
  SUBMITTED = 'submitted',   // 已提交
  REVIEWING = 'reviewing',   // 审查中
  VOTING = 'voting',         // 投票中
  PASSED = 'passed',         // 已通过
  REJECTED = 'rejected',     // 已否决
  MERGED = 'merged',         // 已合并
  CLOSED = 'closed'          // 已关闭
}

export interface StateTransition {
  from: ProposalState;
  to: ProposalState;
  condition: () => Promise<boolean>;
  action: () => Promise<void>;
}

export class WorkflowEngine {
  private stateMachine: Map<ProposalState, StateTransition[]>;

  async transition(proposalId: string, newState: ProposalState): Promise<boolean> {
    // 验证状态转换
    // 执行转换动作
    // 更新状态
  }

  async getState(proposalId: string): Promise<ProposalState> {
    // 获取当前状态
  }

  async getHistory(proposalId: string): Promise<ProposalState[]> {
    // 获取状态历史
  }
}
```

**进度条**:

```markdown
## 提案进度

```
[████████████░░░░░░░░] 60%

✓ 发起提案 (2026-03-13)
✓ 创建 Worktree (2026-03-13)
✓ 开发完成 (2026-03-14)
✓ 代码审查 (2026-03-15)
◐ 投票进行中 (2/5 IDE)
○ 等待结果
```

剩余时间：5 天 23 小时
```

**优先级**: 🟡 **P1 - 重要功能**

---

### 3.5 数据统计分析模块

#### 需求分析

**当前问题**:
- 无投票数据统计
- 无提案趋势分析
- 无 IDE 活跃度统计
- 无决策效率评估

#### 设计方案

**统计面板**:

```typescript
// src/analytics/dashboard.ts
export interface AnalyticsDashboard {
  // 提案统计
  proposals: {
    total: number;
    passed: number;
    rejected: number;
    pending: number;
    passRate: number;
  };

  // 投票统计
  voting: {
    averageParticipation: number;  // 平均参与率
    averageDuration: number;        // 平均时长（天）
    byLevel: {                      // 按级别统计
      level1: { total: number; passed: number };
      level2: { total: number; passed: number };
      level3: { total: number; passed: number };
    };
  };

  // IDE 统计
  ideActivity: {
    total: number;
    active: number;
    topContributors: Array<{
      ide: string;
      proposals: number;
      votes: number;
      passRate: number;
    }>;
  };

  // 趋势分析
  trends: {
    proposalsPerMonth: Array<{ month: string; count: number }>;
    passRateTrend: Array<{ month: string; rate: number }>;
  };
}
```

**可视化图表**:

```typescript
// src/analytics/charts.tsx
import { LineChart, BarChart, PieChart } from 'recharts';

export function ProposalTrendChart({ data }: { data: TrendData[] }) {
  return (
    <LineChart data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="proposals" stroke="#8884d8" />
      <Line type="monotone" dataKey="passed" stroke="#82ca9d" />
    </LineChart>
  );
}

export function VotingParticipationPie({ data }: { data: PieData[] }) {
  return (
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" />
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
```

**决策效率评估**:

```typescript
// src/analytics/efficiency-metrics.ts
export class EfficiencyMetrics {
  async calculateDecisionSpeed(): Promise<number> {
    // 计算平均决策时间（从发起到通过）
    // 单位：天
  }

  async calculateParticipationRate(): Promise<number> {
    // 计算平均投票参与率
    // IDE 参与数 / IDE 总数
  }

  async calculateQualityScore(proposalId: string): Promise<number> {
    // 评估提案质量
    // 基于：审查意见数、修改次数、最终效果
  }

  async generateReport(period: string): Promise<EfficiencyReport> {
    // 生成效率报告
    // 包含所有指标和改进建议
  }
}
```

**优先级**: 🟡 **P2 - 增强功能**

---

### 3.6 通知提醒系统

#### 需求分析

**当前问题**:
- 无自动通知
- 依赖人工查看
- 投票截止无提醒
- 状态变更无感知

#### 设计方案

**通知类型**:

```typescript
// src/notifications/notification-types.ts
export enum NotificationType {
 NewProposal = 'new_proposal',      // 新提案
  VoteRequested = 'vote_requested',  // 请求投票
  VoteReminder = 'vote_reminder',   // 投票提醒
  VoteClosed = 'vote_closed',       // 投票结束
  ProposalPassed = 'proposal_passed', // 提案通过
  ProposalRejected = 'proposal_rejected', // 提案否决
  CommentMention = 'comment_mention', // 被@提及
  StatusChanged = 'status_changed'  // 状态变更
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipient: string;
  title: string;
  content: string;
  link: string;
  read: boolean;
  createdAt: Date;
}
```

**通知渠道**:

```typescript
// src/notifications/channels.ts
export class NotificationChannel {
  async sendEmail(notification: Notification): Promise<void> {
    // 发送邮件通知
  }

  async sendTelegram(notification: Notification): Promise<void> {
    // 发送 Telegram 消息
  }

  async sendInApp(notification: Notification): Promise<void> {
    // 应用内通知
  }

  async sendWebhook(notification: Notification): Promise<void> {
    // Webhook 通知
  }
}
```

**智能提醒**:

```typescript
// src/notifications/smart-reminders.ts
export class SmartReminder {
  async scheduleVotingReminder(proposalId: string): Promise<void> {
    // 投票开始后 3 天，提醒未投票者
    // 投票截止前 24 小时，再次提醒
  }

  async detectInactivity(): Promise<void> {
    // 检测 7 天未活跃的 IDE
    // 发送激活邮件
  }

  async escalateUrgent(proposalId: string): Promise<void> {
    // 紧急提案（如安全修复）
    // 立即通知所有相关人员
  }
}
```

**优先级**: 🟡 **P1 - 重要功能**

---

## 四、实施优先级

### 4.1 优先级矩阵

| 功能模块 | 重要性 | 紧急性 | 实现难度 | 优先级 | 预计工期 |
|---------|--------|--------|----------|--------|----------|
| **文档结构优化** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | **P0** | 3 天 |
| **权限管理机制** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **P0** | 5 天 |
| **提案流程可视化** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | **P1** | 4 天 |
| **通知提醒系统** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | **P1** | 5 天 |
| **数据统计分析** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | **P2** | 7 天 |
| **协作编辑工具** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | **P2** | 10 天 |
| **版本控制功能** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | **P2** | 6 天 |

---

### 4.2 分阶段实施计划

#### 第一阶段（P0 - 核心基础，1-2 周）

**目标**: 建立基本文档架构和权限系统

**任务**:
1. ✅ 重构文档目录结构（3 天）
2. ✅ 实现中枢导航系统（2 天）
3. ✅ 清理重复和过时文档（2 天）
4. ✅ 实现权限管理基础框架（5 天）
5. ✅ 编写核心新增文档（4 天）

**交付物**:
- 新的文档目录结构
- docs/README.md 中枢导航
- 权限管理模块
- 6 个核心新增文档

---

#### 第二阶段（P1 - 关键增强，2-3 周）

**目标**: 提升用户体验和流程透明度

**任务**:
1. ✅ 实现审批流程可视化（4 天）
2. ✅ 实现通知提醒系统（5 天）
3. ✅ 实现投票进度追踪（3 天）
4. ✅ 实现基础统计分析（4 天）
5. ✅ 优化提案模板（2 天）

**交付物**:
- 流程图和状态追踪
- 通知系统（邮件/Telegram）
- 投票进度条
- 基础统计面板

---

#### 第三阶段（P2 - 高级功能，3-4 周）

**目标**: 完善协作工具和数据分析

**任务**:
1. ✅ 实现在线协作编辑器（10 天）
2. ✅ 实现版本控制系统（6 天）
3. ✅ 实现高级数据分析（7 天）
4. ✅ 实现冲突解决机制（5 天）
5. ✅ 性能优化和测试（5 天）

**交付物**:
- 实时协作编辑器
- 版本历史和对比
- 高级分析面板
- 冲突解决工具

---

#### 第四阶段（P3 - 持续优化，持续）

**目标**: 根据反馈持续改进

**任务**:
1. ⚠️ 收集用户反馈
2. ⚠️ 性能监控和优化
3. ⚠️ 功能迭代更新
4. ⚠️ 文档持续维护

---

## 五、详细实施建议

### 5.1 文档结构优化实施

#### 步骤 1: 创建新目录结构（Day 1）

```bash
# 创建新目录
mkdir -p docs/{01-核心规范，02-协作指南/{快速开始，工作流程，工具使用，决议系统},03-架构设计，04-任务规划，05-学习资源，06-历史归档/2026-03,06-历史归档/DEPRECATED,07-提案记录}

# 迁移文档（保持 Git 历史）
git mv docs/guidelines/* docs/01-核心规范/
git mv docs/collaboration/QUICK_GUIDE.md docs/02-协作指南/快速开始/
# ... 其他迁移

# 删除过时文档
git rm docs/collaboration/IDE_ONBOARDING.md
git rm docs/collaboration/ENVIRONMENT_RULES.md
# ... 其他删除
```

#### 步骤 2: 编写中枢导航（Day 2-3）

```markdown
# CloseClaw 文档中枢

## 🎯 快速导航（按角色）

### 我是新 IDE
[路径引导]

### 我要发起提案
[路径引导]

### 我要参与投票
[路径引导]

## 📊 文档地图
[可视化地图]

## 🔥 最近更新
[动态列表]
```

#### 步骤 3: 新增核心文档（Day 4-5）

- `02-协作指南/快速开始/03-FIRST_CONTRIBUTION.md`
- `02-协作指南/工作流程/01-PROPOSAL_WORKFLOW.md`
- `02-协作指南/工作流程/02-VOTING_GUIDE.md`
- `04-任务规划/01-ROADMAP.md`
- `05-学习资源/04-FAQ.md`

---

### 5.2 权限管理实施

#### 步骤 1: 实现角色系统（Day 1-2）

```typescript
// src/auth/roles.ts
export enum Role { /* ... */ }
export const rolePermissions: Record<Role, Permission> = { /* ... */ };
```

#### 步骤 2: 实现权限管理器（Day 3-4）

```typescript
// src/auth/permission-manager.ts
export class PermissionManager {
  async can(userId: string, permission: string): Promise<boolean> { /* ... */ }
  async upgradeRole(userId: string, newRole: Role): Promise<void> { /* ... */ }
}
```

#### 步骤 3: 集成到投票系统（Day 5）

```typescript
// src/voting/vote-validator.ts
async function validateVote(proposalId: string, userId: string): Promise<boolean> {
  const canVote = await permissionManager.can(userId, 'canVote');
  if (!canVote) {
    throw new Error('无投票权限');
  }
  // ... 其他验证
}
```

---

### 5.3 流程可视化实施

#### 步骤 1: 定义状态机（Day 1）

```typescript
// src/workflow/state-machine.ts
export enum ProposalState { /* ... */ }
```

#### 步骤 2: 实现工作流引擎（Day 2-3）

```typescript
// src/workflow/workflow-engine.ts
export class WorkflowEngine {
  async transition(proposalId: string, newState: ProposalState): Promise<boolean> { /* ... */ }
}
```

#### 步骤 3: 创建可视化组件（Day 4）

```tsx
// src/workflow/progress-bar.tsx
export function ProgressBar({ proposalId }: { proposalId: string }) {
  // 渲染进度条
}
```

---

## 六、风险评估与缓解

### 6.1 风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 文档迁移丢失历史 | 中 | 高 | 使用 `git mv` 保留历史 |
| 权限系统过于复杂 | 高 | 中 | 简化角色，渐进实施 |
| 用户抵触新流程 | 中 | 中 | 充分沟通，提供培训 |
| 开发周期过长 | 高 | 高 | 分阶段，优先 P0 |
| 技术选型错误 | 低 | 高 | 小范围试点，快速迭代 |

---

### 6.2 成功指标

| 指标 | 当前值 | 目标值 | 测量方式 |
|------|--------|--------|----------|
| 文档查找时间 | 5-10 分钟 | <2 分钟 | 用户测试 |
| 提案发起数量 | 2/月 | 10/月 | 统计数据 |
| 投票参与率 | 30% | 70% | 统计数据 |
| 用户满意度 | - | >4/5 | 问卷调查 |
| 新人上手时间 | 2 周 | 3 天 | 跟踪调查 |

---

## 七、总结与建议

### 7.1 核心建议

1. **立即执行（本周）**
   - ✅ 启动文档结构优化
   - ✅ 设计中枢导航系统
   - ✅ 清理重复文档

2. **近期执行（2 周内）**
   - ✅ 实现权限管理基础
   - ✅ 实现流程可视化
   - ✅ 实现通知提醒

3. **中期规划（1-2 月）**
   - ⚠️ 实现在线协作编辑
   - ⚠️ 实现版本控制
   - ⚠️ 实现数据分析

4. **长期愿景（3-6 月）**
   - 🔮 专业化工具替代
   - 🔮 AI 辅助决策
   - 🔮 生态系统建设

---

### 7.2 关键成功因素

1. **高层支持**: 核心团队认可并推动
2. **用户参与**: 充分收集 IDE 和用户反馈
3. **渐进实施**: 分阶段，快速迭代
4. **文档先行**: 完善的文档和培训
5. **数据驱动**: 基于统计持续优化

---

### 7.3 下一步行动

1. **发起提案**: 将本方案作为正式提案
2. **组织投票**: 启动三级决议流程
3. **成立小组**: 组建实施团队
4. **制定计划**: 细化 P0 阶段任务
5. **开始执行**: 立即启动文档优化

---

> **文档驱动决策，数据驱动优化**  
> **CloseClaw - 让协作更公平、透明、高效** 🚀

---

## 附录

### 附录 A: 文档迁移清单

[详细迁移清单表格]

### 附录 B: 权限矩阵详细设计

[完整权限矩阵]

### 附录 C: 技术选型对比

[技术方案对比表]

### 附录 D: 用户调研结果

[调研数据和分析]

---

**文档版本**: v1.0  
**创建日期**: 2026-03-13  
**审核状态**: 待审议  
**提案 ID**: 待分配
