#!/usr/bin/env node
/**
 * 自动化投票统计脚本 (v2.0)
 * 
 * 功能：
 * 1. 解析 votes/ 目录中的所有提案文件
 * 2. 提取协作主体投票和用户投票
 * 3. 计算法定人数和通过状态
 * 4. 输出控制台报表和 JSON 报告
 * 
 * 编码：UTF-8
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOTES_DIR = path.join(__dirname, '..', 'votes');

// 提案级别配置
const PROPOSAL_LEVELS = {
  '一级': { minVotes: 2, weight: 1 },
  '二级': { minVotes: 3, weight: 2 },
  '三级': { minVotes: 5, weight: 3 } // 统一为 5 票（三级决议）
};

/**
 * 解析 Markdown 表格行
 */
function parseTableRow(line) {
  return line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
}

/**
 * 从提案文件提取投票信息
 */
function parseProposal(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const lines = content.split('\n');
  
  const result = {
    id: null,
    title: null,
    level: '一级',
    status: '投票中',
    votes: [],
    userVote: null,
    ideTotalScore: 0,
    userScore: 0,
    quorumMet: false,
    passed: false,
    filename: filename
  };
  
  // 提取提案 ID
  const idMatch = content.match(/>\s*\*\*提案 ID\*\*:\s*(\d+)/) || filename.match(/(\d+)/);
  if (idMatch) result.id = idMatch[1];
  
  // 提取提案标题
  const titleMatch = content.match(/^#\s*(?:提案\s*\d+[:：]?)?\s*(.+)/m);
  if (titleMatch) result.title = titleMatch[1].trim();
  
  // 提取提案级别
  const levelMatch = content.match(/>\s*\*\*提案级别\*\*:\s*([一二三级]+)/);
  if (levelMatch) result.level = levelMatch[1];
  
  // 提取状态
  const statusMatch = content.match(/>\s*\*\*状态\*\*:\s*([^ \n]+)/);
  if (statusMatch) result.status = statusMatch[1].trim();
  
  // 解析投票表格
  let inIdeVoteTable = false;
  let inUserVoteTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测协作主体投票表头
    if (line.includes('协作主体投票') || line.includes('IDE 投票')) {
      inIdeVoteTable = true;
      inUserVoteTable = false;
      continue;
    }
    
    // 检测用户投票表头
    if (line.includes('用户投票')) {
      inIdeVoteTable = false;
      inUserVoteTable = true;
      continue;
    }
    
    // 解析协作主体投票行
    if (inIdeVoteTable && line.startsWith('|') && !line.includes(':---') && !line.includes('协作主体')) {
      const cells = parseTableRow(line);
      if (cells.length >= 2) {
        const subject = cells[0].replace(/^[✅❌⚪]\s*/, '').trim();
        const attitude = cells[1].includes('赞同') ? '赞同' : 
                        cells[1].includes('反对') ? '反对' : '弃权';
        const score = attitude === '赞同' ? 1 : attitude === '反对' ? -2 : 0; // 反对为 -2
        
        result.votes.push({ subject, attitude, score, note: cells[3] || '' });
        result.ideTotalScore += (attitude === '赞同' ? 1 : 0);
        // 注意：计算逻辑在后面统一处理
      }
    }
    
    // 解析用户投票
    if (inUserVoteTable && line.startsWith('|') && !line.includes(':---') && !line.includes('用户')) {
      const cells = parseTableRow(line);
      if (cells.length >= 2) {
        result.userVote = cells[1].includes('赞同') ? '赞同' : 
                         cells[1].includes('反对') ? '反对' : '弃权';
      }
    }
  }
  
  // 获取参与人数
  const participatingIdes = result.votes.filter(v => v.attitude !== '弃权').length;
  const n = participatingIdes || 1; // 协作主体总数（参与者）
  
  // 计算得分 (规则: 赞成+1, 反对+2) -> 这里简化为逻辑判断
  const ideAgree = result.votes.filter(v => v.attitude === '赞同').length;
  const ideOppose = result.votes.filter(v => v.attitude === '反对').length;
  
  // 用户得分: 0.5n
  if (result.userVote === '赞同') {
    result.userScore = 0.5 * n;
  } else if (result.userVote === '反对') {
    result.userScore = -0.5 * n;
  }
  
  const agreeScore = ideAgree * 1 + (result.userVote === '赞同' ? 0.5 * n : 0);
  const opposeScore = ideOppose * 2 + (result.userVote === '反对' ? 0.5 * n : 0);
  
  // 判断法定人数
  const minRequired = PROPOSAL_LEVELS[result.level]?.minVotes || 2;
  result.quorumMet = participatingIdes >= minRequired;
  
  // 判断是否通过
  result.passed = result.quorumMet && (agreeScore > opposeScore);
  
  return result;
}

/**
 * 扫描所有提案
 */
function scanProposals() {
  if (!fs.existsSync(VOTES_DIR)) return [];
  const files = fs.readdirSync(VOTES_DIR)
    .filter(f => f.startsWith('proposal-') && f.endsWith('.md'))
    .map(f => path.join(VOTES_DIR, f));
  
  return files.map(parseProposal);
}

/**
 * 输出报表
 */
function printReport(proposals) {
  console.log('\n📊 CloseClaw 提案投票统计报告');
  console.log('=' .repeat(50));
  
  const sorted = proposals.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));
  
  for (const p of sorted) {
    const statusIcon = p.passed ? '✅' : p.quorumMet ? '🟡' : '⚪';
    const statusText = p.passed ? '已通过' : p.quorumMet ? '投票中' : '待参与';
    console.log(`\n提案 ${p.id || '??'} [${p.level}]: ${statusIcon} ${statusText}`);
    console.log(`  标题: ${p.title || p.filename}`);
    console.log(`  参与: ${p.votes.length} 协作主体 | 用户: ${p.userVote || '未投票'}`);
    console.log(`  结果: ${p.passed ? '通过' : '未通过'} (法定人数: ${p.quorumMet ? '是' : '否'})`);
  }
  
  console.log('\n' + '='.repeat(50));
}

/**
 * 主函数
 */
function main() {
  const targetId = process.argv[2];
  let proposals = scanProposals();
  
  if (targetId) {
    proposals = proposals.filter(p => p.id === targetId);
  }
  
  printReport(proposals);
  
  // 输出 JSON (供 CI 使用)
  if (process.env.GITHUB_OUTPUT || process.env.OUTPUT_JSON) {
    const report = {
      timestamp: new Date().toISOString(),
      proposals: proposals
    };
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `report=${JSON.stringify(report)}\n`);
    } else {
      console.log('\n📦 JSON Report:');
      console.log(JSON.stringify(report, null, 2));
    }
  }
}

main();
