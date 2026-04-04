# CloseClaw 启动脚本
# 用法：直接双击运行或在 PowerShell 中执行 .\start.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CloseClaw 启动脚本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 .env 文件
if (-not (Test-Path ".env")) {
    Write-Host "[错误] 未找到 .env 文件" -ForegroundColor Red
    Write-Host "请复制 .env.example 为 .env 并配置你的 API Keys" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 检查 Node.js
Write-Host "[1/4] 检查 Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js 版本: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ 未安装 Node.js，请先安装 Node.js 20+" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 检查 Go
Write-Host "[2/4] 检查 Go..." -ForegroundColor Green
try {
    $goVersion = go version
    Write-Host "  ✓ Go 版本: $goVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ 未安装 Go，请先安装 Go 1.21+" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 编译 Go 内核
Write-Host "[3/4] 编译 Go 内核..." -ForegroundColor Green
if (-not (Test-Path "tmp")) {
    New-Item -ItemType Directory -Path "tmp" | Out-Null
}
Push-Location kernel
go build -o ../tmp/kernel.exe .
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host "  ✗ Go 内核编译失败" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}
Write-Host "  ✓ Go 内核编译成功" -ForegroundColor Gray

# 编译 TypeScript
Write-Host "[4/4] 编译 TypeScript..." -ForegroundColor Green
npm run build | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ TypeScript 编译失败" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}
Write-Host "  ✓ TypeScript 编译成功" -ForegroundColor Gray

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  启动 CloseClaw" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在启动 Go 内核..." -ForegroundColor Yellow
Start-Process -FilePath ".\tmp\kernel.exe" -WindowStyle Normal

Write-Host "等待 3 秒让内核启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "正在启动 TypeScript 执行器..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal

Write-Host ""
Write-Host "✓ CloseClaw 已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "两个窗口已打开：" -ForegroundColor Cyan
Write-Host "  1. Go 内核 (kernel.exe)" -ForegroundColor Gray
Write-Host "  2. TypeScript 执行器 (npm start)" -ForegroundColor Gray
Write-Host ""
Write-Host "按 Ctrl+C 停止进程，或直接关闭窗口" -ForegroundColor Yellow
Write-Host ""
Read-Host "按回车键退出启动脚本"
