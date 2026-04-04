# CloseClaw Startup Script
# Usage: Double-click to run or execute .\start.ps1 in PowerShell

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CloseClaw Startup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your API Keys" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "  OK Node.js version: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR Node.js not installed. Please install Node.js 20+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Go
Write-Host "[2/4] Checking Go..." -ForegroundColor Green
try {
    $goVersion = go version
    Write-Host "  OK Go version: $goVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR Go not installed. Please install Go 1.21+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Build Go kernel
Write-Host "[3/4] Building Go kernel..." -ForegroundColor Green
if (-not (Test-Path "tmp")) {
    New-Item -ItemType Directory -Path "tmp" | Out-Null
}
Push-Location kernel
go build -o ../tmp/kernel.exe .
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host "  ERROR Go kernel build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  OK Go kernel built successfully" -ForegroundColor Gray

# Build TypeScript
Write-Host "[4/4] Building TypeScript..." -ForegroundColor Green
npm run build | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR TypeScript build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  OK TypeScript built successfully" -ForegroundColor Gray

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Starting CloseClaw" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Go kernel..." -ForegroundColor Yellow
Start-Process -FilePath ".\tmp\kernel.exe" -WindowStyle Normal

Write-Host "Waiting 3 seconds for kernel to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting TypeScript executor..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal

Write-Host ""
Write-Host "OK CloseClaw started!" -ForegroundColor Green
Write-Host ""
Write-Host "Two windows opened:" -ForegroundColor Cyan
Write-Host "  1. Go kernel (kernel.exe)" -ForegroundColor Gray
Write-Host "  2. TypeScript executor (npm start)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop, or close the windows directly" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit this script"
