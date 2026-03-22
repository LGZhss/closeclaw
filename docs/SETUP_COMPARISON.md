# NanoClaw vs CloseClaw 安装流程对比

> **分析日期**: 2026-03-22  
> **目的**: 对比 NanoClaw 和 CloseClaw 的安装流程实现差异

---

## 📋 概述

NanoClaw 采用**模块化、交互式**的安装流程，通过 Claude Code 与用户交互完成配置。  
CloseClaw 采用**简化、一次性**的安装脚本，减少交互步骤。

---

## 🔄 架构对比

### NanoClaw 安装架构

```
setup/index.ts (CLI 入口)
    ↓
步骤化安装（--step 参数）
    ├── environment    - 环境检查
    ├── container      - 容器配置
    ├── groups         - 群组同步
    ├── register       - 通道注册
    ├── mounts         - 挂载配置
    ├── service        - 服务配置
    └── verify         - 验证安装
```

**特点**:
- 每个步骤独立运行
- 通过 `emitStatus()` 输出结构化状态
- Claude Code 读取状态并与用户交互
- 支持多种消息通道（WhatsApp, Telegram, Slack, Discord）

### CloseClaw 安装架构

```
setup/index.ts (一次性脚本)
    ↓
顺序执行所有步骤
    ├── checkEnvironment()      - 环境检查
    ├── createDirectories()     - 创建目录
    ├── setupEnvFile()          - 配置 .env
    ├── installDependencies()   - 安装依赖
    ├── createContextMdFiles()  - 创建记忆文件
    ├── buildContainer()        - 构建容器（可选）
    └── displayNextSteps()      - 显示后续步骤
```

**特点**:
- 一次性运行所有步骤
- 直接输出到终端（彩色日志）
- 无交互式配置
- 主要支持 Telegram（通过 .env 配置）

---

## 🎯 关键差异

### 1. **安装方式**

| 特性 | NanoClaw | CloseClaw |
|------|----------|-----------|
| **执行方式** | 分步执行 (`--step`) | 一次性执行 |
| **交互性** | 高（Claude Code 交互） | 低（手动编辑 .env） |
| **状态输出** | 结构化 JSON | 终端彩色日志 |
| **配置方式** | 命令行参数 | .env 文件 |

### 2. **环境检查**

#### NanoClaw (`setup/environment.ts`)
```typescript
// 检查项目
- 操作系统（macOS, Linux, Windows, WSL）
- 是否无头环境（Headless）
- Apple Container 是否安装
- Docker 是否运行
- 现有配置（.env, auth, registered_groups）

// 输出格式
emitStatus('CHECK_ENVIRONMENT', {
  PLATFORM: 'darwin',
  IS_WSL: false,
  APPLE_CONTAINER: 'installed',
  DOCKER: 'running',
  HAS_ENV: true,
  HAS_AUTH: true,
  HAS_REGISTERED_GROUPS: true,
  STATUS: 'success'
});
```

#### CloseClaw (`setup/index.ts`)
```typescript
// 检查项目
- Node.js 版本（20+）
- Docker 是否安装
- npm 是否安装

// 输出格式
log('  ✓ Node.js 20+', colors.green);
log('  ✓ Docker', colors.green);
log('  ✓ npm', colors.green);
```

**差异**:
- NanoClaw 检查更全面（WSL、Headless、现有配置）
- NanoClaw 输出结构化数据供 Claude Code 解析
- CloseClaw 只检查基本依赖

### 3. **通道注册**

#### NanoClaw (`setup/register.ts`)
```typescript
// 支持多种通道
--channel whatsapp|telegram|slack|discord

// 参数
--jid <群组ID>
--name <群组名称>
--trigger <触发词>
--folder <群组文件夹>
--channel <通道类型>
--no-trigger-required
--is-main
--assistant-name <助手名称>

// 功能
1. 写入 SQLite 数据库（registered_groups 表）
2. 创建群组文件夹（groups/<folder>/）
3. 更新 CLAUDE.md 中的助手名称
4. 更新 .env 中的 ASSISTANT_NAME
```

#### CloseClaw (`setup/index.ts`)
```typescript
// 只支持 Telegram
// 通过 .env 配置
TELEGRAM_TOKEN=...
ALLOWED_USER_IDS=...

// 功能
1. 复制 .env.example 到 .env
2. 提示用户手动编辑
3. 创建默认群组文件夹（groups/main/, groups/global/）
4. 创建 CONTEXT.md 文件
```

**差异**:
- NanoClaw 支持多种通道，CloseClaw 主要支持 Telegram
- NanoClaw 通过命令行参数配置，CloseClaw 通过 .env 文件
- NanoClaw 自动写入数据库，CloseClaw 依赖运行时注册

### 4. **群组同步**

#### NanoClaw (`setup/groups.ts`)
```typescript
// WhatsApp 群组同步
1. 检查 WhatsApp 认证（store/auth/）
2. 构建 TypeScript 代码
3. 运行临时脚本连接 WhatsApp
4. 调用 groupFetchAllParticipating() 获取所有群组
5. 写入 chats 表（jid, name, last_message_time）

// 其他通道
- 自动跳过（运行时解析群组名称）

// 列出群组
npx tsx setup/index.ts --step groups --list --limit 30
```

#### CloseClaw
```typescript
// 无群组同步步骤
// Telegram 群组信息在运行时获取
// 通过 TelegramChannel.handleUpdate() 解析
```

**差异**:
- NanoClaw 需要预先同步 WhatsApp 群组
- CloseClaw 依赖运行时动态获取群组信息
- NanoClaw 提供群组列表功能

### 5. **容器配置**

#### NanoClaw (`setup/container.ts`)
```typescript
// 容器运行时选择
1. 检测 Apple Container 或 Docker
2. 配置容器运行时
3. 构建容器镜像
4. 写入配置到数据库

// 支持
- Apple Container（macOS）
- Docker（跨平台）
```

#### CloseClaw
```typescript
// 已废弃容器方案
// 使用 Sandbox 架构（子进程 + Worker Threads）
// 可选构建 Docker 镜像（向后兼容）
```

**差异**:
- NanoClaw 依赖容器隔离
- CloseClaw 使用轻量级沙盒方案

### 6. **服务配置**

#### NanoClaw (`setup/service.ts`)
```typescript
// 配置系统服务
1. 生成 systemd 服务文件（Linux）
2. 生成 launchd plist 文件（macOS）
3. 配置自动启动
4. 设置日志路径

// 支持
- systemd（Linux）
- launchd（macOS）
- 手动启动（Windows）
```

#### CloseClaw
```typescript
// 无系统服务配置
// 提供启动脚本
- start.bat / start.sh（生产模式）
- start-dev.bat / start-dev.sh（开发模式）
```

**差异**:
- NanoClaw 集成系统服务
- CloseClaw 使用简单的启动脚本

---

## 📊 功能对比表

| 功能 | NanoClaw | CloseClaw | 说明 |
|------|----------|-----------|------|
| **环境检查** | ✅ 全面 | ✅ 基础 | NanoClaw 检查更详细 |
| **依赖安装** | ✅ | ✅ | 都支持 npm install |
| **容器配置** | ✅ Docker/Apple | ⚠️ 可选 | CloseClaw 已废弃容器 |
| **通道注册** | ✅ 多通道 | ⚠️ Telegram | NanoClaw 支持更多通道 |
| **群组同步** | ✅ WhatsApp | ❌ | CloseClaw 运行时获取 |
| **挂载配置** | ✅ | ❌ | CloseClaw 无挂载需求 |
| **系统服务** | ✅ systemd/launchd | ❌ | CloseClaw 使用启动脚本 |
| **验证安装** | ✅ | ⚠️ 手动 | NanoClaw 自动验证 |
| **交互式配置** | ✅ Claude Code | ❌ | CloseClaw 手动编辑 .env |

---

## 🎯 用户体验对比

### NanoClaw 安装流程

```bash
# 1. 克隆仓库
git clone <repo> && cd nanoclaw

# 2. 运行安装（Claude Code 交互）
# Claude Code 会自动执行以下步骤：

# 步骤 1: 环境检查
npx tsx setup/index.ts --step environment

# 步骤 2: 容器配置
npx tsx setup/index.ts --step container

# 步骤 3: 群组同步（WhatsApp）
npx tsx setup/index.ts --step groups

# 步骤 4: 通道注册
npx tsx setup/index.ts --step register \
  --jid 120363xxxxx@g.us \
  --name "My Group" \
  --trigger "@Andy" \
  --folder my-group \
  --channel whatsapp

# 步骤 5: 挂载配置
npx tsx setup/index.ts --step mounts

# 步骤 6: 服务配置
npx tsx setup/index.ts --step service

# 步骤 7: 验证安装
npx tsx setup/index.ts --step verify

# 3. 启动服务
npm start
```

**优点**:
- 全自动化，Claude Code 引导
- 支持多种通道
- 配置验证完整

**缺点**:
- 依赖 Claude Code
- 步骤较多
- 需要容器环境

### CloseClaw 安装流程

```bash
# 1. 克隆仓库
git clone <repo> && cd closeclaw

# 2. 运行安装脚本
npm run setup
# 或
npx tsx setup/index.ts

# 3. 编辑 .env 文件
# TELEGRAM_TOKEN=your-bot-token
# ALLOWED_USER_IDS=your-user-id
# ZHIPU_API_KEY=your-api-key

# 4. 启动
npm start
# 或
./start.bat  # Windows
./start.sh   # Linux/Mac
```

**优点**:
- 简单快速
- 无需 Claude Code
- 无容器依赖

**缺点**:
- 需要手动配置 .env
- 主要支持 Telegram
- 无自动验证

---

## 🔧 技术实现对比

### 状态输出

#### NanoClaw
```typescript
// setup/status.ts
export function emitStatus(step: string, data: Record<string, any>): void {
  console.log(JSON.stringify({ STEP: step, ...data }));
}

// Claude Code 解析
const output = execSync('npx tsx setup/index.ts --step environment');
const status = JSON.parse(output);
if (status.STATUS === 'success') {
  // 继续下一步
}
```

#### CloseClaw
```typescript
// setup/index.ts
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  // ...
};

function log(message: string, color: string) {
  console.log(`${color}${message}${colors.reset}`);
}

log('  ✓ Node.js 20+', colors.green);
```

### 数据库操作

#### NanoClaw
```typescript
// setup/register.ts
import { initDatabase, setRegisteredGroup } from '../src/db.ts';

initDatabase();
setRegisteredGroup(jid, {
  name,
  folder,
  trigger,
  added_at: new Date().toISOString(),
  requiresTrigger,
  isMain,
});
```

#### CloseClaw
```typescript
// setup/index.ts
// 不直接操作数据库
// 运行时通过 src/index.ts 初始化
```

---

## 📚 文件结构对比

### NanoClaw Setup 文件

```
setup/
├── index.ts              # CLI 入口
├── status.ts             # 状态输出
├── platform.ts           # 平台检测
├── environment.ts        # 环境检查
├── container.ts          # 容器配置
├── groups.ts             # 群组同步
├── register.ts           # 通道注册
├── mounts.ts             # 挂载配置
├── service.ts            # 系统服务
└── verify.ts             # 验证安装
```

### CloseClaw Setup 文件

```
setup/
└── index.ts              # 一体化安装脚本
```

---

## 🎯 改进建议

### CloseClaw 可以借鉴的 NanoClaw 特性

1. **模块化安装步骤**
   - 拆分为独立的步骤模块
   - 支持单独运行某个步骤
   - 便于调试和维护

2. **结构化状态输出**
   - 输出 JSON 格式状态
   - 便于 IDE 集成（如 Claude Code）
   - 支持自动化测试

3. **通道注册机制**
   - 支持多种消息通道
   - 命令行参数配置
   - 自动写入数据库

4. **安装验证**
   - 自动验证配置
   - 检查依赖完整性
   - 测试通道连接

5. **系统服务集成**
   - 生成 systemd/launchd 配置
   - 支持自动启动
   - 日志管理

### NanoClaw 可以借鉴的 CloseClaw 特性

1. **简化安装流程**
   - 减少交互步骤
   - 提供默认配置
   - 快速上手

2. **去容器化**
   - 使用轻量级沙盒
   - 降低部署复杂度
   - 更好的跨平台兼容

3. **启动脚本**
   - 提供简单的启动脚本
   - 支持开发/生产模式
   - 无需系统服务配置

---

## 🎯 结论

### NanoClaw 安装流程
- **优势**: 全自动化、多通道支持、Claude Code 集成
- **劣势**: 步骤复杂、依赖容器、需要 Claude Code

### CloseClaw 安装流程
- **优势**: 简单快速、无容器依赖、易于理解
- **劣势**: 手动配置、主要支持 Telegram、无自动验证

### 建议
- **短期**: CloseClaw 保持简化流程，适合快速部署
- **长期**: 借鉴 NanoClaw 的模块化设计，支持更多通道
- **平衡**: 提供两种安装模式（快速模式 + 高级模式）

---

## 📚 参考资料

- [NanoClaw Setup 源代码](E:\nanoclaw\setup\)
- [CloseClaw Setup 源代码](./setup/index.ts)
- [NanoClaw vs CloseClaw 架构对比](./NANOCLAW_VS_CLOSECLAW.md)
- [Phase 3 实施计划](./phase-3-implementation-plan.md)
