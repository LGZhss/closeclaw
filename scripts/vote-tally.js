#!/usr/bin/env node

/**
 * 投票统计脚本
 * 用于统计 votes/ 目录中所有提案的投票结果
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VOTES_DIR = path.join(__dirname, '../votes');

function parseProposal(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取提案 ID
  const idMatch = content.match(/\*\*提案 ID\*\*:\s*(\d+)/);
  const proposalId = idMatch ? idMatch[1] : 'unknown';
  
  // 提取提案标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Unknown';
  
  // 提取投票表
  const voteTableMatch = content.match(/\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(✅|❌|⏳)\s*\|\s*([+-]?\d+)\s*\|/g);
  
  const votes = {
    approve: 0,
    reject: 0,
    abstain: 0,
    pending: 0,
    details: []
  };
  
  if (voteTableMatch) {
    voteTableMatch.forEach(row => {
      const match = row.match(/\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(✅|❌|⏳)\s*\|\s*([+-]?\d+)\s*\|/);
      if (match) {
        const [, subject, model, status, score] = match;
        const scoreNum = parseInt(score);
        
        if (status === '✅') {
          votes.approve += scoreNum;
        } else if (status === '❌') {
          votes.reject += scoreNum;
        } else if (status === '⏳') {
          votes.pending++;
        }
        
        votes.details.push({
          subject: subject.trim(),
          model: model.trim(),
          status,
          score: scoreNum
        });
      }
    });
  }
  
  return {
    id: proposalId,
    title,
    file: path.basename(filePath),
    votes
  };
}

function main() {
  console.log('\n📊 CloseClaw 投票统计\n');
  console.log('='.repeat(80));
  
  if (!fs.existsSync(VOTES_DIR)) {
    console.log('❌ votes/ 目录不存在');
    process.exit(1);
  }
  
  const files = fs.readdirSync(VOTES_DIR)
    .filter(f => f.startsWith('proposal-') && f.endsWith('.md'))
    .sort();
  
  if (files.length === 0) {
    console.log('📭 没有找到提案文件');
    process.exit(0);
  }
  
  const proposals = files.map(f => parseProposal(path.join(VOTES_DIR, f)));
  
  proposals.forEach(proposal => {
    console.log(`\n📋 提案 ${proposal.id}: ${proposal.title}`);
    console.log(`   文件: ${proposal.file}`);
    console.log(`   赞成: ${proposal.votes.approve} | 反对: ${proposal.votes.reject} | 待投: ${proposal.votes.pending}`);
    
    const total = proposal.votes.approve + proposal.votes.reject + proposal.votes.pending;
    const participated = proposal.votes.approve + proposal.votes.reject;
    const participation = total > 0 ? ((participated / total) * 100).toFixed(1) : 0;
    
    console.log(`   参与率: ${participation}% (${participated}/${total})`);
    
    if (proposal.votes.approve > proposal.votes.reject) {
      console.log(`   ✅ 通过`);
    } else if (proposal.votes.reject > proposal.votes.approve) {
      console.log(`   ❌ 未通过`);
    } else {
      console.log(`   ⏳ 投票中`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n总计: ${proposals.length} 个提案\n`);
}

main();
