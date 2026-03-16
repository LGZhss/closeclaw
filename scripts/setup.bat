@echo off
REM CloseClaw 快速设置脚本（Windows）

echo ================================================
echo    CloseClaw 设置向导
echo ================================================
echo.

REM 检查 Node.js
echo [1/5] 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 20+
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)
echo [✓] Node.js 已安装

REM 检查 Docker
echo.
echo [2/5] 检查 Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到 Docker
    echo 容器功能将不可用，建议安装 Docker Desktop
    echo 下载地址：https://www.docker.com/products/docker-desktop
) else (
    echo [✓] Docker 已安装
)

REM 创建目录
echo.
echo [3/5] 创建目录结构...
if not exist "store" mkdir store
if not exist "data" mkdir data
if not exist "data\sessions" mkdir data\sessions
if not exist "data\ipc" mkdir data\ipc
if not exist "data\env" mkdir data\env
if not exist "groups" mkdir groups
if not exist "groups\main" mkdir groups\main
if not exist "groups\global" mkdir groups\global
if not exist "logs" mkdir logs
echo [✓] 目录创建完成

REM 复制 .env 文件
echo.
echo [4/5] 配置环境变量...
if not exist ".env" (
    copy .env.example .env >nul
    echo [✓] 已创建 .env 文件
    echo [提示] 请编辑 .env 文件并添加 API 密钥
) else (
    echo [✓] .env 文件已存在
)

REM 安装依赖
echo.
echo [5/5] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [✓] 依赖安装完成

REM 构建容器（如果 Docker 可用）
echo.
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 构建容器镜像...
    call bash container\build.sh
    if %errorlevel% equ 0 (
        echo [✓] 容器镜像构建完成
    ) else (
        echo [警告] 容器镜像构建失败，可以稍后手动构建
    )
)

echo.
echo ================================================
echo    设置完成！
echo ================================================
echo.
echo 下一步：
echo 1. 编辑 .env 文件并添加 ANTHROPIC_API_KEY
echo 2. 运行 npm start 启动 CloseClaw
echo 3. 或使用 npm run dev 进入开发模式
echo.
pause
