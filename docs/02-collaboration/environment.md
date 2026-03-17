# 环境拓扑与进度提取规则

&gt; **文档**: 环境拓扑与进度提取规则
&gt; **版本**: 3.1
&gt; **目的**: 指导协作主体如何正确提取和理解环境信息

---

## 📋 概述

本文档定义了协作主体如何正确提取CloseClaw项目的环境拓扑和当前进度。请仔细阅读并遵循，避免生搬硬套导致模型误解。

---

## 🔍 环境拓扑提取

### 1. 项目根目录识别

**核心原则**: 从当前工作目录开始，逐步识别项目结构。

**关键文件识别**:
- `package.json` - Node.js项目标识
- `tsconfig.json` - TypeScript配置
- `.env.example` - 环境变量模板
- `README.md` - 项目说明

**注意事项**:
- ❌ 不要假设固定路径
- ✅ 动态探测项目根目录
- ✅ 检查多个可能的标识文件

---

### 2. 目录结构扫描

**需要扫描的关键目录**:

```
.closeclaw/
├── src/                    # 源代码目录
│   ├── core/              # 核心模块
│   ├── adapters/          # LLM适配器
│   ├── sandbox/           # 沙盒层
│   ├── tools/             # 工具层
│   └── channels/          # 通道层
├── docs/                  # 文档目录
│   ├── architecture/       # 架构文档
│   ├── guides/            # 指南文档
│   ├── reference/         # 参考文档
│   ├── contributing/      # 贡献文档
│   └── roadmap/           # 路线图
├── tests/                 # 测试目录
├── registered_collaborator/ # 注册的协作主体
├── groups/                # 组配置
├── scripts/               # 脚本工具
├── templates/             # 模板文件
└── votes/                 # 提案投票
```

**提取方法**:
1. ✅ 使用文件系统API动态扫描
2. ✅ 缓存扫描结果避免重复I/O
3. ✅ 处理权限不足的情况
4. ❌ 不要硬编码目录结构

---

### 3. 配置文件提取

**关键配置文件**:

| 文件 | 用途 | 提取内容 |
|------|------|---------|
| `package.json` | 依赖管理 | name, version, scripts, dependencies |
| `tsconfig.json` | TypeScript配置 | compilerOptions, include, exclude |
| `.env.example` | 环境变量 | 所有环境变量键名 |
| `.gitignore` | Git忽略 | 忽略规则（了解什么不提交） |

**提取方法**:
1. ✅ 读取配置文件内容
2. ✅ 解析JSON格式
3. ✅ 处理格式错误（有默认值）
4. ❌ 不要假设所有配置都存在

---

### 4. 代码模块识别

**核心模块识别**:

| 模块 | 文件路径 | 功能 |
|------|---------|------|
| Voting Engine | `src/core/voter.js` | 投票引擎 |
| Agent Registry | `src/core/agentRegistry.js` | 智能体注册表 |
| Arbitrator | `src/core/arbitrator.js` | 仲裁模块 |
| Sandbox Manager | `src/sandbox/sandboxManager.js` | 沙盒管理器 |
| Dispatcher | `src/core/dispatcher.js` | 调度器 |
| Tool Registry | `src/tools/toolRegistry.js` | 工具注册表 |

**提取方法**:
1. ✅ 检查文件是否存在
2. ✅ 读取文件内容了解接口
3. ✅ 识别关键类和函数
4. ❌ 不要假设所有模块都已实现

---

## 📊 进度提取

### 1. 文档进度检查

**需要检查的文档**:

| 文档 | 路径 | 检查内容 |
|------|------|---------|
| 最终架构 | `docs/architecture/FINAL_ARCHITECTURE.md` | 是否存在、是否完整 |
| 协作规则 | `docs/guides/COLLABORATION_RULES_v3.md` | 是否存在、版本号 |
| 协作主体引导 | `docs/03-development/onboarding.md` | 是否存在 |
| 环境规则 | `docs/guides/ENVIRONMENT_RULES.md` | 是否存在 |
| 注册流程 | `docs/reference/REGISTRATION_FLOW.md` | 是否存在 |
| 规划任务 | `docs/roadmap/TASK_PLANNING.md` | 是否存在 |

**提取方法**:
1. ✅ 检查文件是否存在
2. ✅ 读取文件头部元数据
3. ✅ 检查文档完整性
4. ✅ 生成进度报告

---

### 2. 代码实现进度检查

**需要检查的代码模块**:

| 模块 | 优先级 | 检查内容 |
|------|--------|---------|
| Agent Registry | P1 前期 | 是否存在、基础功能 |
| Voting Engine | P1 前期 | 是否存在、核心逻辑 |
| 进程沙盒 | P1 前期 | 是否存在、基础实现 |
| Arbitrator | P1 中期 | 是否存在 |
| Worker 沙盒 | P1 中期 | 是否存在 |
| 完整测试 | P1 中期 | 测试覆盖率 |
| isolated-vm POC | P1 后期 | 是否完成 |

**提取方法**:
1. ✅ 检查文件是否存在
2. ✅ 检查Git提交历史（如有）
3. ✅ 查看TODO和FIXME注释
4. ✅ 生成实现进度矩阵

---

### 3. 投票记录检查

**需要检查的投票记录**:

| 记录 | 路径 | 检查内容 |
|------|------|---------|
| Round 2投票 | `ROUND2_VOTING_RESULT.md` | 是否存在 |
| 提案投票 | `proposals/*.md` | 提案列表、状态 |

**提取方法**:
1. ✅ 检查投票记录文件
2. ✅ 统计投票数量
3. ✅ 统计通过率
4. ✅ 生成投票活动报告

---

## ⚠️ 避免生搬硬套

### 常见错误及避免方法

#### 错误1: 硬编码路径
**错误做法**:
```javascript
const projectRoot = 'E:/.closeclaw';
```

**正确做法**:
```javascript
const projectRoot = findProjectRoot(process.cwd());

function findProjectRoot(startPath) {
  let current = startPath;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'package.json'))) {
      return current;
    }
    current = path.dirname(current);
  }
  return startPath;
}
```

---

#### 错误2: 假设所有模块都已实现
**错误做法**:
```javascript
import { VotingEngine } from './src/core/voter.js';
const engine = new VotingEngine();
```

**正确做法**:
```javascript
async function initVotingEngine() {
  const voterPath = './src/core/voter.js';
  if (!fs.existsSync(voterPath)) {
    console.warn('VotingEngine not implemented yet');
    return null;
  }
  
  try {
    const { VotingEngine } = await import(voterPath);
    return new VotingEngine();
  } catch (error) {
    console.error('Failed to load VotingEngine:', error);
    return null;
  }
}
```

---

#### 错误3: 忽略配置缺失
**错误做法**:
```javascript
const config = require('./config.json');
const apiKey = config.apiKey;
```

**正确做法**:
```javascript
function getConfig(key, defaultValue = null) {
  try {
    const config = require('./config.json');
    return config[key] ?? defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

const apiKey = getConfig('apiKey', process.env.API_KEY);
```

---

#### 错误4: 不处理文件不存在
**错误做法**:
```javascript
const content = fs.readFileSync('some-file.md', 'utf8');
```

**正确做法**:
```javascript
async function readFileSafe(filePath, defaultValue = '') {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`File not found: ${filePath}`);
      return defaultValue;
    }
    throw error;
  }
}
```

---

## 📝 环境报告模板

提取完环境信息后，生成标准化的环境报告：

```markdown
# CloseClaw 环境报告

&gt; **生成时间**: 2026-03-13
&gt; **生成者**: [协作主体名称]

---

## 📁 项目结构

- 项目根目录: [路径]
- 核心目录:
  - ✅ src/
  - ✅ docs/
  - ⏳ tests/
  - ⏳ memory/

---

## 📚 文档状态

| 文档 | 状态 | 版本 |
|------|------|------|
| FINAL_ARCHITECTURE.md | ✅ 存在 | 2.0.0 |
| COLLABORATION_RULES_v3.md | ✅ 存在 | 3.0.0 |
| IDE_ONBOARDING.md | ✅ 存在 | - |
| ENVIRONMENT_RULES.md | ✅ 存在 | - |
| REGISTRATION_FLOW.md | ⏳ 待创建 | - |
| TASK_PLANNING.md | ⏳ 待创建 | - |

---

## 💻 代码实现进度

| 模块 | 状态 | 优先级 |
|------|------|--------|
| Agent Registry | ⏳ 未开始 | P1 前期 |
| Voting Engine | ⏳ 未开始 | P1 前期 |
| 进程沙盒 | ⏳ 未开始 | P1 前期 |
| Arbitrator | ⏳ 未开始 | P1 中期 |
| Worker沙盒 | ⏳ 未开始 | P1 中期 |
| isolated-vm POC | ⏳ 未开始 | P1 后期 |

---

## 🗳️ 投票活动

- 总提案数: 0
- 已通过: 0
- 进行中: 0
- 通过率: 0%

---

## 🎯 下一步建议

1. 创建缺失的文档
2. 开始实现P1前期核心模块
3. 设置开发环境
4. 初始化Git仓库（如需要）
```

---

## 🔗 相关文档

- [IDE协作机制引导](../contributing/IDE_ONBOARDING.md)
- [最终架构文档](../architecture/FINAL_ARCHITECTURE.md)
- [协作规则 v3.0](./COLLABORATION_RULES_v3.md)

---

&gt; **遵循以上规则提取环境信息！**
&gt; **避免生搬硬套，保持灵活性和容错性**
