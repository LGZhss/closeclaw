# CloseClaw Stop Script
# Usage: Double-click to run or execute .\stop.ps1 in PowerShell

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CloseClaw Stop Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Stop kernel.exe
Write-Host "Stopping Go kernel..." -ForegroundColor Yellow
$kernelProcesses = Get-Process -Name "kernel" -ErrorAction SilentlyContinue
if ($kernelProcesses) {
    $kernelProcesses | Stop-Process -Force
    Write-Host "  OK Stopped $($kernelProcesses.Count) kernel.exe process(es)" -ForegroundColor Green
} else {
    Write-Host "  - No running kernel.exe found" -ForegroundColor Gray
}

# Stop node.exe (npm start)
Write-Host "Stopping TypeScript executor..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*closeclaw*" -or $_.Path -like "*closeclaw*"
}
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "  OK Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "  - No running Node.js processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "OK CloseClaw stopped" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
