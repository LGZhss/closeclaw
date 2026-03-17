# CloseClaw - 初始化开发环境（PowerShell 版本）
# Windows 兼容性脚本

param(
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Show-Help {
    Write-Host @"
CloseClaw 开发环境初始化脚本

用法: .\init-dev-dir.ps1 [选项]

选项:
  -Help      显示此帮助信息

功能:
  1. 检查 Node.js 和 npm 是否安装
  2. 创建必要的数据目录
  3. 创建 .env 文件（如果不存在）
  4. 创建群组记忆文件
  5. 初始化 Git hooks（可选）

示例:
  .\init-dev-dir.ps1           # 完整初始化
  .\init-dev-dir.ps1 -Help     # 显示帮助
"@
    exit 0
}

if ($Help) {
    Show-Help
}

Write-Info "🚀 开始初始化 CloseClaw 开发环境..."
Write-Host ""

# 1. 检查 Node.js
Write-Info "📦 检查 Node.js 安装..."
try {
    $nodeVersion = node --version
    if ($nodeVersion -match "^v(20|21|22)") {
        Write-Success "  ✓ Node.js 已安装：$nodeVersion"
    } else {
        Write-Error-Custom "  ⚠ Node.js 版本不匹配（需要 v20/v21/v22），当前：$nodeVersion"
        Write-Info "  请升级 Node.js: https://nodejs.org/"
        exit 1
    }
} catch {
    Write-Error-Custom "  ❌ 未检测到 Node.js"
    Write-Info "  请安装 Node.js 20+: https://nodejs.org/"
    exit 1
}

# 2. 检查 npm
Write-Info "📦 检查 npm 安装..."
try {
    $npmVersion = npm --version
    Write-Success "  ✓ npm 已安装：v$npmVersion"
} catch {
    Write-Error-Custom "  ❌ 未检测到 npm"
    exit 1
}

Write-Host ""

# 3. 创建必要目录
Write-Info "📁 创建数据目录..."
$directories = @(
    "store",
    "data",
    "data/sessions",
    "data/ipc",
    "data/env",
    "groups",
    "groups/main",
    "groups/global",
    "logs",
    "votes"
)

foreach ($dir in $directories) {
    $path = Join-Path $PSScriptRoot ".." $dir
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Success "  ✓ 创建目录：$dir"
    } else {
        Write-Success "  ✓ 目录已存在：$dir"
    }
}

Write-Host ""

# 4. 创建 .env 文件
Write-Info "⚙️  配置环境变量..."
$envPath = Join-Path $PSScriptRoot ".." ".env"
if (-not (Test-Path $envPath)) {
    $envExample = Join-Path $PSScriptRoot ".." ".env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envPath
        Write-Success "  ✓ 已创建 .env 文件（复制自 .env.example）"
        Write-Info "  📝 请编辑 .env 文件并填入你的 API 密钥"
    } else {
        # 创建基础 .env 文件
        @"
# CloseClaw 环境变量配置
# 请根据你的模型提供商填写相应的密钥

# Gemini API（推荐，免费额度充足）
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash-preview

# OpenRouter API（聚合服务，支持多种模型）
OPENROUTER_API_KEY=your-openrouter-api-key-here

# 其他可选 API
MODELSCOPE_API_KEY=
MOONSHOT_API_KEY=
ZHIPU_API_KEY=

# 系统配置
ASSISTANT_NAME=CloseClaw
TZ=Asia/Shanghai
WORKSPACE_DIR=$PWD\data

# Telegram 配置（可选）
TELEGRAM_TOKEN=
ALLOWED_USER_IDS=
"@ | Out-File -FilePath $envPath -Encoding utf8
        Write-Success "  ✓ 已创建 .env 文件"
        Write-Info "  📝 请编辑 .env 文件并填入你的 API 密钥"
    }
} else {
    Write-Success "  ✓ .env 文件已存在"
}

Write-Host ""

# 5. 创建群组记忆文件
Write-Info "📝 创建群组记忆文件..."

# Global CONTEXT.md
$globalContextPath = Join-Path $PSScriptRoot ".." "groups" "global" "CONTEXT.md"
if (-not (Test-Path $globalContextPath)) {
    @"
# 全局记忆

这是 CloseClaw 项目的全局共享记忆文件。

## 项目偏好
- 使用中文回复
- 简洁明了，避免冗长
- 注重实践而非理论

## 技术栈
- **语言**: TypeScript (Node.js 20+)
- **数据库**: SQLite (better-sqlite3)
- **日志**: Pino
- **验证**: Zod

## 协作规则
- 所有代码修改必须通过提案 + 投票流程
- 遵循三级决议制度
- 尊重少数意见

## 已注册协作主体
| 名称 | ID | 主要模型 | 注册日期 |
|------|-----|----------|----------|
| (在此添加新的协作主体) |

---
最后更新：$(Get-Date -Format "yyyy-MM-dd")
"@ | Out-File -FilePath $globalContextPath -Encoding utf8
    Write-Success "  ✓ 创建 groups/global/CONTEXT.md"
} else {
    Write-Success "  ✓ groups/global/CONTEXT.md 已存在"
}

# Main CONTEXT.md
$mainContextPath = Join-Path $PSScriptRoot ".." "groups" "main" "CONTEXT.md"
if (-not (Test-Path $mainContextPath)) {
    @"
# 主通道记忆

这是 CloseClaw 的主通道专用记忆文件。

## 当前状态
- **设置完成时间**: $(Get-Date -Format "yyyy-MM-dd")
- **版本**: 2.0.0
- **架构**: 基于 NanoClaw

## 主通道特权

主通道是唯一可以执行管理操作的通道：

### 群组管理
- 添加新群组
- 移除群组
- 列出所有群组

### 全局记忆
- 写入全局记忆
- 仅主通道可以修改 groups/global/CONTEXT.md

### 任务管理
- 为任何群组创建任务
- 查看所有群组的任务
- 管理任务状态

## 当前配置
- **助手名称**: CloseClaw
- **触发词**: @CloseClaw
- **时区**: Asia/Shanghai

---
最后更新：$(Get-Date -Format "yyyy-MM-dd")
"@ | Out-File -FilePath $mainContextPath -Encoding utf8
    Write-Success "  ✓ 创建 groups/main/CONTEXT.md"
} else {
    Write-Success "  ✓ groups/main/CONTEXT.md 已存在"
}

Write-Host ""

# 6. 安装依赖（可选）
Write-Info "📦 是否需要安装 npm 依赖？"
$response = Read-Host "输入 Y 安装依赖，或按 Enter 跳过"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Info "正在安装依赖..."
    try {
        & npm install
        Write-Success "  ✓ 依赖安装完成"
    } catch {
        Write-Error-Custom "  ⚠ 依赖安装失败，请手动运行：npm install"
    }
} else {
    Write-Info "  ℹ️  稍后可以手动运行：npm install"
}

Write-Host ""

# 7. 完成
Write-Success "✅ 初始化完成！"
Write-Host ""
Write-Info "下一步："
Write-Host "  1. 编辑 .env 文件并填入你的 API 密钥"
Write-Host "  2. 运行 npm install 安装依赖（如果尚未安装）"
Write-Host "  3. 运行 npm start 启动 CloseClaw"
Write-Host "  4. 阅读 docs/contributing/IDE_ONBOARDING.md 了解协作规则"
Write-Host ""
