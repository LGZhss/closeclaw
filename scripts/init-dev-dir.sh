#!/bin/bash

# CloseClaw 开发目录初始化脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 默认配置
DEFAULT_DIR="$HOME/dev/closeclaw-proposals"
WORKTREES_DIR="${CLOSECLAW_WORKTREES_DIR:-$DEFAULT_DIR}"

print_info "╔════════════════════════════════════════╗"
print_info "║  CloseClaw 开发目录初始化              ║"
print_info "╚════════════════════════════════════════╝"
echo ""
print_info "目标目录：$WORKTREES_DIR"
echo ""

# 检查 Git 仓库
if [ ! -d ".git" ]; then
    print_error "当前目录不是 Git 仓库！"
    print_info "请在 CloseClaw 主项目目录运行此脚本"
    exit 1
fi

# 创建开发目录
if [ ! -d "$WORKTREES_DIR" ]; then
    print_info "创建开发目录..."
    mkdir -p "$WORKTREES_DIR"
    print_success "已创建：$WORKTREES_DIR"
else
    print_info "开发目录已存在：$WORKTREES_DIR"
fi

# 创建投票文档目录（可选）
VOTES_DIR="$HOME/dev/closeclaw-votes"
if [ ! -d "$VOTES_DIR" ]; then
    print_info "创建投票文档目录..."
    mkdir -p "$VOTES_DIR"
    print_success "已创建：$VOTES_DIR"
else
    print_info "投票文档目录已存在：$VOTES_DIR"
fi

# 添加到 shell 配置
SHELL_CONFIG=""
if [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.config/fish/config.fish" ]; then
    SHELL_CONFIG="$HOME/.config/fish/config.fish"
fi

if [ -n "$SHELL_CONFIG" ]; then
    print_info "检查 shell 配置：$SHELL_CONFIG"
    
    # 检查是否已配置
    if ! grep -q "CLOSECLAW_WORKTREES_DIR" "$SHELL_CONFIG"; then
        print_info "添加环境变量到 $SHELL_CONFIG"
        {
            echo ""
            echo "# CloseClaw 开发目录配置"
            echo "export CLOSECLAW_WORKTREES_DIR=\"$WORKTREES_DIR\""
        } >> "$SHELL_CONFIG"
        print_success "环境变量已添加到 $SHELL_CONFIG"
        print_info "运行 'source $SHELL_CONFIG' 使配置生效"
    else
        print_info "环境变量已在 $SHELL_CONFIG 中配置"
        print_info "如需修改，请编辑 $SHELL_CONFIG"
    fi
else
    print_warning "未找到常见的 shell 配置文件"
    print_info "请手动设置环境变量:"
    echo "  export CLOSECLAW_WORKTREES_DIR=\"$WORKTREES_DIR\""
fi

echo ""
print_success "╔════════════════════════════════════════╗"
print_success "║  初始化完成！                          ║"
print_success "╚════════════════════════════════════════╝"
echo ""
echo "目录结构:"
echo "  主项目：$(pwd)"
echo "  提案目录：$WORKTREES_DIR"
echo "  投票目录：$VOTES_DIR"
echo ""
echo "下一步:"
echo "  1. 创建第一个提案："
echo "     ./scripts/git-utils.sh create 001 my-feature"
echo ""
echo "  2. 查看提案目录："
echo "     cd $WORKTREES_DIR"
echo ""
echo "  3. 查看所有 worktree："
echo "     git worktree list"
echo ""
