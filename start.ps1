# CloseClaw Startup Script
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CloseClaw Startup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env not found" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[1/4] Checking Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "  OK Node.js: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR Node.js not installed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[2/4] Checking Go..." -ForegroundColor Green
try {
    $goVersion = go version
    Write-Host "  OK Go: $goVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR Go not installed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[3/4] Building Go kernel..." -ForegroundColor Green
if (-not (Test-Path "tmp")) {
    New-Item -ItemType Directory -Path "tmp" | Out-Null
}
Push-Location kernel
go build -o ../tmp/kernel.exe .
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host "  ERROR Go build failed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  OK Go kernel built" -ForegroundColor Gray

Write-Host "[4/4] Building TypeScript..." -ForegroundColor Green
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR TypeScript build failed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  OK TypeScript built" -ForegroundColor Gray

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Starting CloseClaw" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Go kernel..." -ForegroundColor Yellow
Start-Process -FilePath ".\tmp\kernel.exe" -WindowStyle Normal

Write-Host "Waiting 3 seconds..." -ForegroundColor Yellow
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
Write-Host "Press Ctrl+C to stop or close windows" -ForegroundColor Yellow
Write-Host ""
pause