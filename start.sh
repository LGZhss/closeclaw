#!/bin/bash
# CloseClaw 快速启动脚本
# 自动构建并启动系统

set -e

echo ""
echo "========================================"
echo "  CloseClaw 启动中..."
echo "========================================"
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "[1/3] 安装依赖..."
    npm install
fi

# 构建项目
echo "[2/3] 构建项目..."
npm run build

# 启动系统
echo "[3/3] 启动 CloseClaw..."
echo ""
echo "----------------------------------------"
echo "系统运行中，按 Ctrl+C 停止"
echo "----------------------------------------"
echo ""

npm start
