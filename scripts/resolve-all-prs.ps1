# Batch resolve PR conflicts
$ErrorActionPreference = "Stop"

$prs = @(34, 41, 25, 44, 27, 28, 35, 36, 37, 39)

Write-Host "Batch Resolve PR Conflicts" -ForegroundColor Cyan
Write-Host ""

$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

Write-Host "Updating main..." -ForegroundColor Green
git fetch origin main

$successCount = 0
$failedPRs = @()

foreach ($prNum in $prs) {
    Write-Host ""
    Write-Host "Processing PR #$prNum..." -ForegroundColor Cyan
    
    $prInfo = gh pr view $prNum --json headRefName,mergeable 2>$null | ConvertFrom-Json
    
    if (-not $prInfo) {
        Write-Host "  Cannot get PR info, skipping" -ForegroundColor Yellow
        $failedPRs += $prNum
        continue
    }
    
    $branchName = $prInfo.headRefName
    $mergeable = $prInfo.mergeable
    
    if ($mergeable -eq "MERGEABLE") {
        Write-Host "  Already mergeable, skipping" -ForegroundColor Green
        $successCount++
        continue
    }
    
    Write-Host "  Checking out $branchName..." -ForegroundColor Yellow
    git fetch origin $branchName 2>$null
    git checkout $branchName 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Cannot checkout branch, skipping" -ForegroundColor Yellow
        $failedPRs += $prNum
        continue
    }
    
    Write-Host "  Rebasing..." -ForegroundColor Yellow
    git rebase origin/main 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Rebase successful" -ForegroundColor Green
        git push origin $branchName --force 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PR #$prNum resolved" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  Push failed" -ForegroundColor Yellow
            git rebase --abort 2>$null
            $failedPRs += $prNum
        }
    } else {
        Write-Host "  Conflicts detected" -ForegroundColor Yellow
        git diff --name-only --diff-filter=U | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
        git rebase --abort 2>$null
        $failedPRs += $prNum
    }
}

Write-Host ""
git checkout $currentBranch 2>$null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Success: $successCount / $($prs.Count)" -ForegroundColor Green

if ($failedPRs.Count -gt 0) {
    Write-Host "Failed PRs: $($failedPRs -join ', ')" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
