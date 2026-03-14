#!/usr/bin/env node
/**
 * PR 准备脚本
 * 
 * 功能: 在提案通过后自动准备分支与 PR 草稿
 * 用法: node scripts/prepare-pr.js <提案ID>
 * 
 * 示例:
 *   node scripts/prepare-pr.js 011
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const VOTES_DIR = path.join(ROOT_DIR, 'votes');
const DRAFTS_DIR = path.join(ROOT_DIR, 'pr-drafts');

/**
 * 解析提案文件
 */
function parseProposal(proposalId) {
  const files = fs.readdirSync(VOTES_DIR)
    .filter(f => f.includes(proposalId) && f.endsWith('.md'));
  
  if (files.length === 0) {
    throw new Error(`未找到提案 ${proposalId} 的文件`);
  }
  
  const filePath = path.join(VOTES_DIR, files[0]);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取关键信息
  const titleMatch = content.match(/#\s*提案[^：]*[：:]\s*([^\n]+)/);
  const title = titleMatch ? titleMatch[1].trim() : '未知提案';
  
  const initiatorMatch = content.match(/发起者[^\n]*[:：]\s*([^\n]+)/);
  const initiator = initiatorMatch ? initiatorMatch[1].trim() : '未知';
  
  const levelMatch = content.match(/提案级别[^一二级三]*([一二三])级/);
  const level = levelMatch ? `${levelMatch[1]}级` : '一级';
  
  // 检查是否已通过
  const passed = content.includes('✅ 已通过') || content.includes('已通过') && content.includes('🟢');
  
  return {
    id: proposalId,
    title,
    initiator,
    level,
    passed,
    filename: files[0],
    content
  };
}

/**
 * 提取变更文件列表
 */
function extractChangedFiles(content) {
  const files = [];
  
  // 匹配 "变更文件" 部分
  const changeMatch = content.match(/变更文件[^]*?(?=## |\n---|$)/);
  if (changeMatch) {
    const lines = changeMatch[0].split('\n');
    for (const line of lines) {
      const fileMatch = line.match(/[-*]\s*[`']?([^`'\n]+\.(ts|js|md|json|sh))[`']?/);
      if (fileMatch) {
        files.push(fileMatch[1].trim());
      }
    }
  }
  
  return files;
}

/**
 * 生成分支名称
 */
function generateBranchName(proposal) {
  const sanitizedTitle = proposal.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  return `feat/proposal-${proposal.id}-${sanitizedTitle}`;
}

/**
 * 创建 PR 草稿
 */
function createPRDraft(proposal) {
  const draftDir = path.join(DRAFTS_DIR, `proposal-${proposal.id}-${proposal.title.substring(0, 20).replace(/\s+/g, '-')}`);
  
  if (!fs.existsSync(draftDir)) {
    fs.mkdirSync(draftDir, { recursive: true });
  }
  
  const changedFiles = extractChangedFiles(proposal.content);
  const branchName = generateBranchName(proposal);
  
  // 生成 PR 描述
  const prBody = `# PR: ${proposal.title}

> **关联提案**: ${proposal.filename}
> **提案级别**: ${proposal.level}
> **提案状态**: ✅ 已通过
> **实施分支**: ${branchName}

---

## 📋 变更说明

本 PR 实现了提案 ${proposal.id} 中定义的功能改进。

### 变更文件
${changedFiles.length > 0 ? changedFiles.map(f => `- ${f}`).join('\n') : '- (详见提案文档)'}

---

## 🗳️ 投票记录

提案已通过法定人数要求，获得足够支持票数。

| 项目 | 状态 |
|------|------|
| 提案级别 | ${proposal.level} |
| 决议结果 | ✅ 已通过 |
| 实施主体 | ${proposal.initiator} |

---

## ✅ 检查清单

- [x] 提案已通过投票
- [x] 代码遵循项目规范
- [x] 使用简体中文
- [x] 变更范围与提案一致

---

> **CloseClaw 协作系统 - 决议驱动开发**
`;

  // 写入 PR 描述文件
  fs.writeFileSync(path.join(draftDir, 'PR_BODY.md'), prBody, 'utf-8');
  
  // 生成 Git 命令脚本
  const gitCommands = `#!/bin/bash
# 提案 ${proposal.id} 分支准备脚本
# 由 prepare-pr.js 自动生成

echo "🚀 准备提案 ${proposal.id} 的实现分支..."

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH="${branchName}"

echo "📋 当前分支: $CURRENT_BRANCH"
echo "🎯 目标分支: $TARGET_BRANCH"

# 创建并切换到新分支
git checkout -b "$TARGET_BRANCH"

echo "✅ 分支 $TARGET_BRANCH 已创建"
echo ""
echo "📦 请在此分支下实现提案变更:"
${changedFiles.map(f => `echo "  - ${f}"`).join('\n')}
echo ""
echo "📝 完成后提交 PR，使用 pr-drafts/ 目录中的 PR_BODY.md 作为描述"
`;

  fs.writeFileSync(path.join(draftDir, 'setup-branch.sh'), gitCommands, 'utf-8');
  
  // 生成 Windows 批处理版本
  const batCommands = `@echo off
REM 提案 ${proposal.id} 分支准备脚本 (Windows)
REM 由 prepare-pr.js 自动生成

echo 🚀 准备提案 ${proposal.id} 的实现分支...

set TARGET_BRANCH=${branchName}

echo 📋 目标分支: %TARGET_BRANCH%

REM 创建并切换到新分支
git checkout -b %TARGET_BRANCH%

echo ✅ 分支 %TARGET_BRANCH% 已创建
echo.
echo 📦 请在此分支下实现提案变更:
${changedFiles.map(f => `echo   - ${f}`).join('\n')}
echo.
echo 📝 完成后提交 PR，使用 pr-drafts 目录中的 PR_BODY.md 作为描述
pause
`;

  fs.writeFileSync(path.join(draftDir, 'setup-branch.bat'), batCommands, 'utf-8');
  
  return { draftDir, branchName, changedFiles };
}

/**
 * 主函数
 */
function main() {
  const proposalId = process.argv[2];
  
  if (!proposalId) {
    console.error('❌ 用法: node prepare-pr.js <提案ID>');
    console.error('   示例: node prepare-pr.js 011');
    process.exit(1);
  }
  
  console.log(`🔍 正在解析提案 ${proposalId}...`);
  
  try {
    const proposal = parseProposal(proposalId);
    
    console.log(`\n📋 提案信息:`);
    console.log(`  标题: ${proposal.title}`);
    console.log(`  级别: ${proposal.level}`);
    console.log(`  发起者: ${proposal.initiator}`);
    console.log(`  状态: ${proposal.passed ? '✅ 已通过' : '⚪ 未通过'}`);
    
    if (!proposal.passed) {
      console.warn('\n⚠️  警告: 提案尚未通过，继续创建草稿供预览');
    }
    
    console.log('\n📝 正在创建 PR 草稿...');
    const result = createPRDraft(proposal);
    
    console.log(`\n✅ PR 草稿已创建:`);
    console.log(`  目录: ${result.draftDir}`);
    console.log(`  分支名: ${result.branchName}`);
    console.log(`\n📦 预期变更文件:`);
    for (const file of result.changedFiles) {
      console.log(`  - ${file}`);
    }
    
    console.log(`\n🚀 下一步:`);
    console.log(`  1. 运行: cd ${result.draftDir} && bash setup-branch.sh`);
    console.log(`  2. 实现变更文件`);
    console.log(`  3. 提交 PR 时使用 PR_BODY.md 作为描述`);
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();
