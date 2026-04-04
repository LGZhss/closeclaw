# CloseClaw 停止脚本
# 用法：直接双击运行或在 PowerShell 中执行 .\stop.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CloseClaw 停止脚本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 停止 kernel.exe
Write-Host "正在停止 Go 内核..." -ForegroundColor Yellow
$kernelProcesses = Get-Process -Name "kernel" -ErrorAction SilentlyContinue
if ($kernelProcesses) {
    $kernelProcesses | Stop-Process -Force
    Write-Host "  ✓ 已停止 $($kernelProcesses.Count) 个 kernel.exe 进程" -ForegroundColor Green
} else {
    Write-Host "  - 未找到运行中的 kernel.exe" -ForegroundColor Gray
}

# 停止 node.exe (npm start)
Write-Host "正在停止 TypeScript 执行器..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*closeclaw*" -or $_.Path -like "*closeclaw*"
}
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "  ✓ 已停止 $($nodeProcesses.Count) 个 Node.js 进程" -ForegroundColor Green
} else {
    Write-Host "  - 未找到运行中的 Node.js 进程" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✓ CloseClaw 已停止" -ForegroundColor Green
Write-Host ""
Read-Host "按回车键退出"
