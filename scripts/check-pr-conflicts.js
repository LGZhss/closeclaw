#!/usr/bin/env node
/**
 * 检查指定 PR 的冲突状态
 */

import { execSync } from 'child_process';

const prNumbers = [25, 27, 28, 34, 35, 36, 37, 39, 41, 44];

console.log('🔍 检查 PR 冲突状态...\n');

for (const prNum of prNumbers) {
  try {
    const result = execSync(
      `gh pr view ${prNum} --json number,title,headRefName,mergeable,baseRefName`,
      { encoding: 'utf-8', env: { ...process.env, HTTP_PROXY: 'http://127.0.0.1:7897', HTTPS_PROXY: 'http://127.0.0.1:7897' } }
    );
    
    const pr = JSON.parse(result);
    const status = pr.mergeable === 'CONFLICTING' ? '❌ 冲突' : 
                   pr.mergeable === 'MERGEABLE' ? '✅ 可合并' : 
                   '⚠️  未知';
    
    console.log(`PR #${pr.number}: ${status}`);
    console.log(`  标题: ${pr.title}`);
    console.log(`  分支: ${pr.headRefName} → ${pr.baseRefName}`);
    console.log('');
  } catch (error) {
    console.log(`PR #${prNum}: ⚠️  无法获取信息`);
    console.log('');
  }
}
