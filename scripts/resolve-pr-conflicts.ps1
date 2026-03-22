# 批量解决 PR 冲突的脚本
# 通过 rebase 到最新的 main 分支来解决冲突

$ErrorActionPreference = "Continue"

# 设置代理
$env:HTTP_PROXY = "http://127.0.0.1:7897"
$env:HTTPS_PROXY = "http://127.0.0.1:7897"

# PR 列表
$PRS = @(25, 27, 28, 34, 35, 36, 37, 39, 41, 44)

Write-Host "🔧 开始解决 PR 冲突..." -ForegroundColor Cyan
Write-Host ""

# 获取最新的 main
Write-Host "获取最新的 main 分支..." -ForegroundColor Yellow
git fetch origin main
Write-Host "✅ 已获取最新的 main 分支" -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0
$failedPRs = @()

foreach ($PR_NUM in $PRS) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "处理 PR #$PR_NUM" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    try {
        # 获取 PR 的分支名
        $prInfo = gh pr view $PR_NUM --json headRefName,title | ConvertFrom-Json
        $BRANCH = $prInfo.headRefName
        $TITLE = $prInfo.title
        
        if ([string]::IsNullOrEmpty($BRANCH)) {
            Write-Host "❌ 无法获取 PR #$PR_NUM 的分支名，跳过" -ForegroundColor Red
            $failCount++
            $failedPRs += $PR_NUM
            Write-Host ""
            continue
        }
        
        Write-Host "标题: $TITLE" -ForegroundColor White
        Write-Host "分支: $BRANCH" -ForegroundColor White
        
        # 检出分支
        Write-Host "检出分支..." -ForegroundColor Yellow
        git fetch origin $BRANCH
        git checkout $BRANCH
        
        # Rebase 到 main
        Write-Host "正在 rebase 到 main..." -ForegroundColor Yellow
        $rebaseResult = git rebase origin/main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Rebase 成功" -ForegroundColor Green
            
            # 强制推送
            Write-Host "正在推送..." -ForegroundColor Yellow
            git push origin $BRANCH --force
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ PR #$PR_NUM 冲突已解决" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "❌ 推送失败" -ForegroundColor Red
                $failCount++
                $failedPRs += $PR_NUM
            }
        } else {
            Write-Host "❌ Rebase 失败，存在冲突需要手动解决" -ForegroundColor Red
            Write-Host "冲突文件需要手动处理" -ForegroundColor Yellow
            
            # 中止 rebase
            git rebase --abort
            
            $failCount++
            $failedPRs += $PR_NUM
        }
    } catch {
        Write-Host "❌ 处理 PR #$PR_NUM 时出错: $_" -ForegroundColor Red
        $failCount++
        $failedPRs += $PR_NUM
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 处理结果" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 成功: $successCount" -ForegroundColor Green
Write-Host "❌ 失败: $failCount" -ForegroundColor Red

if ($failedPRs.Count -gt 0) {
    Write-Host ""
    Write-Host "失败的 PR:" -ForegroundColor Yellow
    foreach ($pr in $failedPRs) {
        Write-Host "  - PR #$pr" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 提示: 失败的 PR 需要手动解决冲突" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
