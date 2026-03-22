#!/bin/bash
# CloseClaw 开发模式启动脚本
# 带热重载的开发服务器

set -e

echo ""
echo "========================================"
echo "  CloseClaw 开发模式"
echo "========================================"
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "[1/2] 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "[2/2] 启动开发服务器（热重载）..."
echo ""
echo "----------------------------------------"
echo "开发服务器运行中，按 Ctrl+C 停止"
echo "文件修改会自动重载"
echo "----------------------------------------"
echo ""

npm run dev
