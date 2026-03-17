#!/bin/bash

# CloseClaw Git 工具脚本
# 用途：简化 Worktree 管理和协作流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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

# 创建新的提案 worktree
create_proposal() {
    local id=$1
    local name=$2
    local target_path="${CLOSECLAW_WORKTREES_DIR:-$HOME/dev/closeclaw-proposals}/proposal-$id"
    
    if [ -z "$id" ] || [ -z "$name" ]; then
        print_error "用法：create_proposal <编号> <名称>"
        print_info "示例：create_proposal 001 voting-feature"
        return 1
    fi
    
    # 确保目标目录存在
    mkdir -p "$(dirname "$target_path")"
    
    # 检查是否已存在
    if [ -d "$target_path" ]; then
        print_warning "Worktree '$target_path' 已存在"
        print_info "切换到现有 worktree: cd $target_path"
        return 1
    fi
    
    # 创建 worktree
    print_info "创建提案 worktree: proposal-$id"
    print_info "目标路径：$target_path"
    git worktree add "$target_path" -b proposal/$id
    
    print_success "已创建 worktree: proposal-$id"
    print_info "路径：$target_path"
    print_info "分支：proposal/$id"
    print_info "下一步：cd $target_path"
}

# 创建审查用 worktree
create_review() {
    local id=$1
    
    if [ -z "$id" ]; then
        print_error "用法：create_review <编号>"
        print_info "示例：create_review 001"
        return 1
    fi
    
    # 检查是否已存在
    if [ -d "../worktrees/review-$id" ]; then
        print_warning "Worktree 'review-$id' 已存在"
        return 1
    fi
    
    # 创建审查 worktree
    print_info "创建审查 worktree: review-$id"
    git worktree add ../worktrees/review-$id proposal/$id
    
    print_success "已创建审查 worktree: review-$id"
    print_info "路径：../worktrees/review-$id"
    print_info "下一步：cd ../worktrees/review-$id"
}

# 清理已完成的 worktree
cleanup_proposal() {
    local id=$1
    
    if [ -z "$id" ]; then
        print_error "用法：cleanup_proposal <编号>"
        print_info "示例：cleanup_proposal 001"
        return 1
    fi
    
    # 检查是否存在
    if [ ! -d "../worktrees/proposal-$id" ]; then
        print_error "Worktree 'proposal-$id' 不存在"
        return 1
    fi
    
    # 删除 worktree
    print_info "清理 worktree: proposal-$id"
    git worktree remove ../worktrees/proposal-$id
    
    print_success "已清理 worktree: proposal-$id"
}

# 清理审查 worktree
cleanup_review() {
    local id=$1
    
    if [ -z "$id" ]; then
        print_error "用法：cleanup_review <编号>"
        return 1
    fi
    
    if [ ! -d "../worktrees/review-$id" ]; then
        print_error "Worktree 'review-$id' 不存在"
        return 1
    fi
    
    print_info "清理审查 worktree: review-$id"
    git worktree remove ../worktrees/review-$id
    
    print_success "已清理 worktree: review-$id"
}

# 列出所有 worktree
list_worktrees() {
    echo ""
    print_info "📋 当前 worktrees:"
    echo ""
    git worktree list
    echo ""
    
    # 统计
    local count=$(git worktree list | wc -l)
    count=$((count - 1))  # 减去标题行
    print_info "总计：$count 个 worktree"
}

# 切换到指定 worktree
switch_worktree() {
    local name=$1
    
    if [ -z "$name" ]; then
        print_error "用法：switch_worktree <名称>"
        print_info "示例：switch_worktree proposal-001"
        return 1
    fi
    
    local target="../worktrees/$name"
    
    if [ ! -d "$target" ]; then
        print_error "Worktree '$name' 不存在"
        return 1
    fi
    
    cd "$target"
    print_success "已切换到：$name"
    print_info "路径：$(pwd)"
    
    # 显示当前分支
    local branch=$(git branch --show-current)
    print_info "分支：$branch"
}

# 显示当前状态
show_status() {
    echo ""
    print_info "📊 当前状态:"
    echo ""
    
    # 当前目录
    print_info "当前路径：$(pwd)"
    
    # 当前分支
    local branch=$(git branch --show-current 2>/dev/null)
    if [ -n "$branch" ]; then
        print_info "当前分支：$branch"
    else
        print_warning "不在 git 仓库中"
    fi
    
    # 工作目录状态
    if git status --porcelain | grep -q .; then
        print_warning "有未提交的更改"
    else
        print_success "工作目录干净"
    fi
    
    echo ""
}

# 显示帮助
show_help() {
    echo ""
    echo "🔧 CloseClaw Git 工具"
    echo ""
    echo "用法:"
    echo "  $0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  create <编号> <名称>    创建提案 worktree"
    echo "  review <编号>           创建审查 worktree"
    echo "  cleanup <编号>          清理提案 worktree"
    echo "  cleanup-review <编号>   清理审查 worktree"
    echo "  list                    列出所有 worktree"
    echo "  switch <名称>           切换到指定 worktree"
    echo "  status                  显示当前状态"
    echo "  help                    显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 create 001 voting-feature     # 创建提案 001"
    echo "  $0 review 001                    # 创建审查 001"
    echo "  $0 switch proposal-001           # 切换到提案 001"
    echo "  $0 list                          # 列出所有 worktree"
    echo "  $0 cleanup 001                   # 清理提案 001"
    echo ""
    echo "提示:"
    echo "  - 可以将脚本添加到 PATH 方便使用"
    echo "  - 使用 'alias git=scripts/git-utils.sh' 替换默认 git 命令"
    echo ""
}

# 主程序
case "$1" in
    create)
        create_proposal "$2" "$3"
        ;;
    review)
        create_review "$2"
        ;;
    cleanup)
        cleanup_proposal "$2"
        ;;
    cleanup-review)
        cleanup_review "$2"
        ;;
    list)
        list_worktrees
        ;;
    switch)
        switch_worktree "$2"
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -n "$1" ]; then
            print_error "未知命令：$1"
            echo ""
        fi
        show_help
        exit 1
        ;;
esac

exit 0
