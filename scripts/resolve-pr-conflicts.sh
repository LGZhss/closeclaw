#!/bin/bash
# 批量解决 PR 冲突的脚本
# 通过 rebase 到最新的 main 分支来解决冲突

set -e

# PR 列表
PRS=(25 27 28 34 35 36 37 39 41 44)

echo "🔧 开始解决 PR 冲突..."
echo ""

# 获取最新的 main
git fetch origin main
echo "✅ 已获取最新的 main 分支"
echo ""

for PR_NUM in "${PRS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "处理 PR #$PR_NUM"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # 获取 PR 的分支名
  BRANCH=$(gh pr view $PR_NUM --json headRefName -q .headRefName)
  
  if [ -z "$BRANCH" ]; then
    echo "❌ 无法获取 PR #$PR_NUM 的分支名，跳过"
    echo ""
    continue
  fi
  
  echo "分支: $BRANCH"
  
  # 检出分支
  git fetch origin $BRANCH
  git checkout $BRANCH
  
  # Rebase 到 main
  echo "正在 rebase 到 main..."
  if git rebase origin/main; then
    echo "✅ Rebase 成功"
    
    # 强制推送
    echo "正在推送..."
    if git push origin $BRANCH --force; then
      echo "✅ PR #$PR_NUM 冲突已解决"
    else
      echo "❌ 推送失败"
    fi
  else
    echo "❌ Rebase 失败，存在冲突需要手动解决"
    echo "请运行以下命令手动解决："
    echo "  git checkout $BRANCH"
    echo "  git rebase origin/main"
    echo "  # 解决冲突后："
    echo "  git rebase --continue"
    echo "  git push origin $BRANCH --force"
    
    # 中止 rebase
    git rebase --abort
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 批量处理完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
