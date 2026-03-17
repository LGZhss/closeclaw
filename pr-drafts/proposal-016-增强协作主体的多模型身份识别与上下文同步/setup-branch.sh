#!/bin/bash
# 提案 016 分支准备脚本
# 由 prepare-pr.js 自动生成

echo "🚀 准备提案 016 的实现分支..."

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH="feat/proposal-016-"

echo "📋 当前分支: $CURRENT_BRANCH"
echo "🎯 目标分支: $TARGET_BRANCH"

# 创建并切换到新分支
git checkout -b "$TARGET_BRANCH"

echo "✅ 分支 $TARGET_BRANCH 已创建"
echo ""
echo "📦 请在此分支下实现提案变更:"
echo "  - groups/global/CONTEXT.md"
echo "  - registered_ide/trae_registration.md"
echo ""
echo "📝 完成后提交 PR，使用 pr-drafts/ 目录中的 PR_BODY.md 作为描述"
