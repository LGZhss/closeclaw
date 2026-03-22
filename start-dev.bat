@echo off
REM CloseClaw 开发模式启动脚本
REM 带热重载的开发服务器

echo.
echo ========================================
echo   CloseClaw 开发模式
echo ========================================
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [1/2] 安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

REM 启动开发服务器
echo [2/2] 启动开发服务器（热重载）...
echo.
echo ----------------------------------------
echo 开发服务器运行中，按 Ctrl+C 停止
echo 文件修改会自动重载
echo ----------------------------------------
echo.

call npm run dev

pause
