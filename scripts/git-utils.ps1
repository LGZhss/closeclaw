# CloseClaw - Git Worktree 管理工具（PowerShell 版本）
# Windows 兼容性脚本

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$ProposalNum,
    
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Show-Help {
    Write-Host @"
CloseClaw Git Worktree 管理工具

用法: .\git-utils.ps1 <命令> [提案编号]

命令:
  create <编号>    创建新的 worktree 用于提案开发
  list             列出所有 worktrees
  clean            清理已完成的 worktrees
  status           显示所有 worktrees 状态
  help             显示此帮助信息

示例:
  .\git-utils.ps1 create 016          # 为提案 016 创建 worktree
  .\git-utils.ps1 list                # 列出所有 worktrees
  .\git-utils.ps1 clean               # 清理已完成的 worktrees
  .\git-utils.ps1 status              # 显示所有 worktrees 状态

工作目录: ~/dev/closeclaw-proposals/
"@
    exit 0
}

if ($Help -or -not $Command) {
    Show-Help
}

# 获取项目根目录
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$WorktreesBase = Join-Path $env:USERPROFILE "dev" "closeclaw-proposals"

# 确保基础目录存在
if (-not (Test-Path $WorktreesBase)) {
    New-Item -ItemType Directory -Path $WorktreesBase -Force | Out-Null
    Write-Success "✓ 创建 worktrees 基础目录：$WorktreesBase"
}

function Create-Worktree {
    param([string]$ProposalNum)
    
    if (-not $ProposalNum) {
        Write-Error-Custom "❌ 错误：缺少提案编号"
        Write-Info "用法：.\git-utils.ps1 create <提案编号>"
        exit 1
    }
    
    $worktreeName = "proposal-$ProposalNum"
    $worktreePath = Join-Path $WorktreesBase $worktreeName
    $branchName = "proposal/$ProposalNum"
    
    Write-Info "🔨 为提案 #$ProposalNum 创建 worktree..."
    Write-Host ""
    
    # 检查分支是否已存在
    $existingBranch = & git branch --list $branchName
    if ($existingBranch) {
        Write-Info "ℹ️  分支 $branchName 已存在，使用现有分支"
    } else {
        Write-Info "📋 创建新分支：$branchName"
        & git checkout -b $branchName
        Write-Success "✓ 分支创建成功"
    }
    
    Write-Host ""
    Write-Info "🌳 创建 worktree..."
    
    # 检查 worktree 是否已存在
    if (Test-Path $worktreePath) {
        Write-Info "ℹ️  Worktree 已存在：$worktreePath"
    } else {
        & git worktree add $worktreePath -b $branchName
        Write-Success "✓ Worktree 创建成功"
    }
    
    Write-Host ""
    Write-Success "✅ Worktree 准备完成！"
    Write-Host ""
    Write-Info "工作目录：$worktreePath"
    Write-Info "Git 分支：$branchName"
    Write-Host ""
    Write-Info "下一步："
    Write-Host "  1. 复制提案模板到 votes/proposal-$ProposalNum.md"
    Write-Host "  2. 编辑提案文件并填写内容"
    Write-Host "  3. 发起投票并获得足够支持"
    Write-Host "  4. 实现代码修改"
    Write-Host "  5. 提交并推送到 GitHub"
    Write-Host ""
}

function List-Worktrees {
    Write-Info "📋 CloseClaw Worktrees"
    Write-Host ""
    
    & git worktree list | ForEach-Object {
        Write-Host "  $_"
    }
    
    Write-Host ""
    Write-Info "Worktrees 基础目录：$WorktreesBase"
    Write-Host ""
}

function Clean-Worktrees {
    Write-Info "🧹 清理已完成的 worktrees..."
    Write-Host ""
    
    $worktrees = & git worktree list
    $count = 0
    
    foreach ($line in $worktrees) {
        $parts = $line -split '\s+'
        if ($parts.Count -lt 2) { continue }
        
        $path = $parts[0]
        $branch = $parts[-1]
        
        # 跳过主分支
        if ($branch -eq "main" -or $branch -eq "[bare]") { continue }
        
        # 询问是否删除
        $response = Read-Host "删除 worktree '$branch' at '$path'? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            Write-Info "  删除：$path"
            & git worktree remove $path 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  ✓ 已删除"
                $count++
            } else {
                Write-Error-Custom "  ⚠ 删除失败（可能有未提交的更改）"
            }
        }
    }
    
    Write-Host ""
    Write-Success "✅ 清理完成！共删除 $count 个 worktrees"
    Write-Host ""
}

function Show-Status {
    Write-Info "📊 Worktrees 状态"
    Write-Host ""
    
    $worktrees = & git worktree list
    
    foreach ($line in $worktrees) {
        $parts = $line -split '\s+'
        if ($parts.Count -lt 2) { continue }
        
        $path = $parts[0]
        $branch = $parts[-1]
        
        Write-Host "  分支：$branch"
        Write-Host "  路径：$path"
        
        # 检查是否有未提交的更改
        $status = & git -C $path status --porcelain
        if ($status) {
            Write-Host "  状态：⚠️  有未提交的更改" -ForegroundColor Yellow
        } else {
            Write-Host "  状态：✓ 干净" -ForegroundColor Green
        }
        
        Write-Host ""
    }
}

# 执行命令
switch ($Command.ToLower()) {
    "create" { Create-Worktree -ProposalNum $ProposalNum }
    "list" { List-Worktrees }
    "clean" { Clean-Worktrees }
    "status" { Show-Status }
    "help" { Show-Help }
    default {
        Write-Error-Custom "❌ 未知命令：$Command"
        Write-Info "运行 '.\git-utils.ps1 help' 查看可用命令"
        exit 1
    }
}
