# CloseClaw 项目文件结构 (New World Order)

> **最后更新**: 2026-03-24 (P028 极简主义重构)
> **状态**: 🟢 已对齐物理实现

---

## 📂 核心三语言目录

| 目录 | 语言 | 职责描述 |
|:--- |:--- |:--- |
| `cmd/` | **Dart** | 控制平面：CLI 交互、守护进程、MCP 服务端。 |
| `kernel/` | **Go** | 状态总线：高并发 SQLite WAL、RPC 路由、调度器。 |
| `src/` | **TS** | 执行沙盒：NPM SDK 调用、管道终端。 |

---

## 📁 顶层结构树

```bash
.closeclaw/
├── bin/                    # 编译产物目录 (closeclaw.exe, kernel.exe)
├── cmd/                    # Dart 控制平面源码
├── kernel/                 # Go 核心代码
├── src/                    # TS 沙盒执行器
├── proto/                  # 跨语言通信协议 (.proto)
├── docs/                   # 极简文档体系 (进场指南、架构路标)
├── groups/                 # 分群组记忆映射 (CONTEXT.md)
├── votes/                  # 协作提案决议区
│   ├── archive/            # 已归档的历史提案 (25+)
│   └── proposal-template.md # 精化版提案母版
├── data/                   # 唯一运行时数据区 (SQLite, Sessions, IPC)
├── archive/                # 项目历史资产封存区 (pr-drafts 等)
├── package.json            # 全局配置
└── RULES.md                # 核心治理规则
```

---

## 🗑️ 已裁撤/删除说明 (僵尸内容)
以下目录/文件在 P028 重构中已被物理移除或归档，不再参与任何逻辑：
- `setup/` (安装引导，已由 README.md 协议替代)
- `templates/` (无索引模板，已归档)
- `gh_bin_new/` (构建残留，已清理)
- `worktrees/` (废除强制规则)
- 所有独立僵尸脚本 (`script.js`, `dev.js`, `start.*` 等)

---

> **CloseClaw - 极简架构，极致效能** 🚀
