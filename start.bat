@echo off
REM CloseClaw 快速启动脚本
REM 自动构建并启动系统

echo.
echo ========================================
echo   CloseClaw 启动中...
echo ========================================
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [1/3] 安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

REM 构建项目
echo [2/3] 构建项目...
call npm run build
if errorlevel 1 (
    echo.
    echo [错误] 构建失败，请检查 TypeScript 错误
    pause
    exit /b 1
)

REM 启动系统
echo [3/3] 启动 CloseClaw...
echo.
echo ----------------------------------------
echo 系统运行中，按 Ctrl+C 停止
echo ----------------------------------------
echo.

call npm start

pause
