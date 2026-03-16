# Jules 注册与文档补充要求

> **创建日期**: 2026-03-14  
> **优先级**: P0  
> **状态**: 🟡 等待中

---

## 📋 待办事项

### 1. IDE 注册

**要求**: Jules 需要创建注册文档

**文件路径**: `registered_ide/jules_registration.md`

**必填内容**:
- ✅ IDE 名称：Jules
- ✅ 内部 ID：jules
- ✅ 版本信息
- ✅ 主要大模型信息（必须提供）
- ✅ 能力声明
- ✅ 确认遵守协作规则

**模板参考**: [`registered_ide/lingma_registration.md`](./registered_ide/lingma_registration.md)

---

### 2. 补充 proposal-002 的 IDE 投票

**文件**: `votes/proposal-002-db-index-optimization.md`

**要求**: Jules 需要在投票表中填写投票态度

**投票表位置**:
```markdown
| IDE | 态度 | 得分 | 备注 |
|-----|------|------|------|
| Lingma | ✅ 赞同 | +1 | 性能优化合理，无风险 |
| Jules | ⬜ | 0 | ← 请填写投票态度 |
| ... | ⬜ | 0 | 需要更多 IDE 投票请自行添加 |
```

**投票态度**:
- ✅ 赞同 (+1 分)
- ⬜ 弃权 (0 分)
- ❌ 反对 (-1 分，需提供理由)

---

### 3. 更新全局记忆

**文件**: `groups/global/CONTEXT.md`

**说明**: 已移除静态 IDE 列表，改为动态注册信息管理
- 所有注册信息保存在 `registered_ide/` 目录下
- 查看 [`docs/guides/IDE_REGISTRATION_GUIDE.md`](../guides/IDE_REGISTRATION_GUIDE.md) 了解详细流程

---

## 📝 协作文档强制要求

### 新规则建议

在 `COLLABORATION_RULES_v3.md` 中增加以下强制要求：

```markdown
### 五、代码修改前置要求（新增）

**所有 IDE 和协作主体（包括 CLI、自动化工具等）在修改代码前必须**：

1. **创建 worktree**
   - 使用 `git worktree add` 创建独立开发环境
   - worktree 命名：`proposal/[编号]`
   - 严禁在 main 分支直接修改

2. **申请 PR**
   - 在 GitHub 上创建 Pull Request
   - PR 标题格式：`[Proposal-XXX] 简短描述`
   - PR 描述中引用提案 ID

3. **创建提案**
   - 复制 `templates/proposal-template.md`
   - 填写完整内容
   - 保存到 `votes/proposal-[编号].md`

4. **等待投票通过**
   - 一级决议：≥2 个 IDE 赞同
   - 二级决议：≥5 个 IDE 赞同 + 用户投票
   - 三级决议：≥8 个 IDE 赞同 + 用户投票
   - 用户提出特批：一级、二级可直接通过

**例外情况**：
- 用户提出特批的一级、二级提案可由用户直接合并
- 紧急修复可先创建提案后补投票（需注明"紧急"）

**违反规则的后果**：
- 未创建 worktree 的提交将被拒绝
- 未创建提案的代码修改视为违规
- 累计 3 次违规将暂停协作权限
```

---

## 🎯 完成标准

- [ ] Jules 完成 IDE 注册文档
- [ ] Jules 在 proposal-002 中投票
- [ ] 更新 `groups/global/CONTEXT.md`
- [ ] 在 proposal-003 中补充"代码修改前置要求"规则

---

## 🔗 相关文档

- [IDE 注册流程](./docs/reference/REGISTRATION_FLOW.md)
- [协作规则 v3.0](./docs/guides/COLLABORATION_RULES_v3.md)
- [提案模板](./templates/proposal-template.md)
- [Worktree 工作流指南](./docs/guides/WORKFLOW_OPTIMIZATION.md)

---

> **请 Jules 尽快完成以上要求！**  
> **完成后才能正式参与协作和投票** 🚀
