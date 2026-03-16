#!/usr/bin/env node
/**
 * 自动化投票统计脚本
 * 
 * 功能: 解析 votes/ 目录中的提案文件，计算投票结果并输出统计报告
 * 用法: node scripts/auto-vote-stats.js [提案ID]
 * 
 * 示例:
 *   node scripts/auto-vote-stats.js           # 统计所有提案
 *   node scripts/auto-vote-stats.js 011       # 统计指定提案
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOTES_DIR = path.join(__dirname, '..', 'votes');

// 提案级别配置
const PROPOSAL_LEVELS = {
  '一级': { minVotes: 2, weight: 1 },
  '二级': { minVotes: 3, weight: 2 },
  '三级': { minVotes: 4, weight: 3 }
};

/**
 * 解析单个提案文件
 */
function parseProposal(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  
  // 提取提案 ID
  const idMatch = content.match(/提案\s*ID[^\d]*(\d+)/i) || filename.match(/(\d+)/);
  const proposalId = idMatch ? idMatch[1] : 'unknown';
  
  // 提取提案级别
  const levelMatch = content.match(/提案级别[^一二级三]*([一二三])级/);
  const level = levelMatch ? `${levelMatch[1]}级` : '一级';
  
  // 提取状态
  const statusMatch = content.match(/状态[^\n]*([🟢🟡⚪✅])/);
  let status = statusMatch ? statusMatch[1] : '⚪';
  
  // 解析投票表格
  const votes = [];
  const voteTableMatch = content.match(/\|[^|]*协作主体[^|]*\|[^|]*态度[^|]*\|[^|]*得分[^|]*\|[^|]*备注[^|]*\|[^]*?(?=\n## |\n---|$)/);
  
  if (voteTableMatch) {
    const lines = voteTableMatch[0].split('\n').filter(line => line.startsWith('|') && !line.includes(':---'));
    for (const line of lines.slice(1)) { // 跳过表头
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 3) {
        const attitude = parts[1];
        const score = parts[2].includes('+1') ? 1 : parts[2].includes('-1') ? -1 : 0;
        if (score !== 0) {
          votes.push({ subject: parts[0], attitude, score, note: parts[3] || '' });
        }
      }
    }
  }
  
  const totalScore = votes.reduce((sum, v) => sum + v.score, 0);
  const levelConfig = PROPOSAL_LEVELS[level] || PROPOSAL_LEVELS['一级'];
  const hasQuorum = votes.length >= levelConfig.minVotes;
  const passed = hasQuorum && totalScore > 0;
  
  return {
    id: proposalId,
    filename,
    level,
    status,
    votes,
    totalScore,
    voteCount: votes.length,
    minRequired: levelConfig.minVotes,
    hasQuorum,
    passed
  };
}

/**
 * 扫描所有提案
 */
function scanProposals() {
  const files = fs.readdirSync(VOTES_DIR)
    .filter(f => f.startsWith('proposal-') && f.endsWith('.md'))
    .map(f => path.join(VOTES_DIR, f));
  
  return files.map(parseProposal);
}

/**
 * 输出统计报告
 */
function printReport(proposals) {
  console.log('\n📊 CloseClaw 提案投票统计报告');
  console.log('=' .repeat(50));
  
  const passed = proposals.filter(p => p.passed);
  const voting = proposals.filter(p => !p.passed && p.hasQuorum);
  const pending = proposals.filter(p => !p.hasQuorum);
  
  console.log(`\n✅ 已通过: ${passed.length} 个`);
  console.log(`🟡 投票中(已达法定人数): ${voting.length} 个`);
  console.log(`⚪ 待投票(未达法定人数): ${pending.length} 个`);
  
  console.log('\n📋 提案详情:');
  console.log('-'.repeat(50));
  
  for (const p of proposals.sort((a, b) => parseInt(a.id) - parseInt(b.id))) {
    const statusIcon = p.passed ? '✅' : p.hasQuorum ? '🟡' : '⚪';
    const statusText = p.passed ? '已通过' : p.hasQuorum ? '投票中' : '待投票';
    console.log(`\n提案 ${p.id} (${p.level}): ${statusIcon} ${statusText}`);
    console.log(`  文件: ${p.filename}`);
    console.log(`  票数: ${p.voteCount}/${p.minRequired} (得分: ${p.totalScore})`);
    
    if (p.votes.length > 0) {
      console.log('  投票详情:');
      for (const v of p.votes) {
        const icon = v.score > 0 ? '👍' : '👎';
        console.log(`    ${icon} ${v.subject}: ${v.attitude}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
}

/**
 * 主函数
 */
function main() {
  const targetId = process.argv[2];
  
  console.log('🔍 正在扫描提案文件...');
  let proposals = scanProposals();
  
  if (targetId) {
    proposals = proposals.filter(p => p.id === targetId);
    if (proposals.length === 0) {
      console.error(`❌ 未找到提案 ${targetId}`);
      process.exit(1);
    }
  }
  
  printReport(proposals);
  
  // 输出 JSON 格式（供其他脚本使用）
  if (process.env.OUTPUT_JSON) {
    console.log('\n📦 JSON 输出:');
    console.log(JSON.stringify(proposals, null, 2));
  }
}

main();
