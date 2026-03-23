@echo off
:: Fix encoding for display
chcp 65001 >nul

echo [CloseClaw Ultra] Running Diagnostic...

:: Set current directory to script location
pushd "%~dp0"

if exist "closeclaw.exe" (
    closeclaw.exe doctor
) else (
    echo [ERROR] closeclaw.exe not found in current directory.
)

echo.
echo ---------------------------------------
echo NOTE: If you see "Go Kernel Offline", it is EXPECTED in Phase 1.
echo.
pause
popd
