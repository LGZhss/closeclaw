# CloseClaw Stop Script
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CloseClaw Stop Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping Go kernel..." -ForegroundColor Yellow
$kernelProcesses = Get-Process -Name "kernel" -ErrorAction SilentlyContinue
if ($kernelProcesses) {
    $kernelProcesses | Stop-Process -Force
    Write-Host "  OK Stopped $($kernelProcesses.Count) kernel process(es)" -ForegroundColor Green
} else {
    Write-Host "  - No kernel.exe running" -ForegroundColor Gray
}

Write-Host "Stopping TypeScript executor..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*closeclaw*" -or $_.Path -like "*closeclaw*"
}
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "  OK Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "  - No Node.js processes running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "OK CloseClaw stopped" -ForegroundColor Green
Write-Host ""
pause