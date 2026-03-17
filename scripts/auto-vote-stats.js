/**
 * 自动投票统计脚本
 * 
 * 功能：
 * 1. 解析 votes/ 目录中的所有提案文件
 * 2. 提取协作主体投票和用户投票
 * 3. 计算法定人数和通过状态
 * 4. 输出 JSON 报告供 GitHub Actions 使用
 * 
 * 编码：UTF-8
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析 Markdown 表格行
 */
function parseTableRow(line) {
  return line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
}

/**
 * 从提案文件提取投票信息
 */
function extractVotes(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const result = {
    proposalId: null,
    proposalTitle: null,
    level: null,
    status: '投票中',
    ideVotes: [],
    userVote: null,
    ideTotalScore: 0,
    userScore: 0,
    quorumMet: false,
    passed: false
  };
  
  // 提取提案 ID
  const idMatch = content.match(/>\s*\*\*提案 ID\*\*:\s*(\d+)/);
  if (idMatch) result.proposalId = idMatch[1];
  
  // 提取提案标题
  const titleMatch = content.match(/^#\s*(?:提案\s*\d+[:：]?)?\s*(.+)/m);
  if (titleMatch) result.proposalTitle = titleMatch[1].trim();
  
  // 提取提案级别
  const levelMatch = content.match(/>\s*\*\*提案级别\*\*:\s*([一二三级]+)/);
  if (levelMatch) result.level = levelMatch[1];
  
  // 提取状态
  const statusMatch = content.match(/>\s*\*\*状态\*\*:\s*(.+)/);
  if (statusMatch) result.status = statusMatch[1].trim();
  
  // 解析协作主体投票表格
  let inIdeVoteTable = false;
  let inUserVoteTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测协作主体投票表头
    if (line.includes('## 🗳️ 协作主体投票') || line.includes('### IDE 投票')) {
      inIdeVoteTable = true;
      inUserVoteTable = false;
      continue;
    }
    
    // 检测用户投票表头
    if (line.includes('### 用户投票') || line.includes('## 👤 用户投票')) {
      inIdeVoteTable = false;
      inUserVoteTable = true;
      continue;
    }
    
    // 检测表格分隔行
    if (line.startsWith('|---')) continue;
    
    // 解析协作主体投票行
    if (inIdeVoteTable && line.startsWith('|')) {
      const cells = parseTableRow(line);
      if (cells.length >= 3 && !cells[0].includes('协作主体')) {
        const subject = cells[0].replace('✅', '').trim();
        const attitude = cells[1].includes('赞同') ? '赞同' : 
                        cells[1].includes('反对') ? '反对' : '弃权';
        const score = attitude === '赞同' ? 1 : attitude === '反对' ? -1 : 0;
        
        result.ideVotes.push({ subject, attitude, score });
        result.ideTotalScore += score;
      }
    }
    
    // 解析用户投票
    if (inUserVoteTable && line.includes('|') && line.includes('态度')) {
      const cells = parseTableRow(line);
      if (cells.length >= 2 && !cells[0].includes('用户')) {
        const attitude = cells[1].includes('赞同') ? '赞同' : 
                        cells[1].includes('反对') ? '反对' : '弃权';
        result.userVote = attitude;
      }
    }
  }
  
  // 计算用户得分
  if (result.userVote === '赞同') {
    result.userScore = result.ideTotalScore * 0.5;
  } else if (result.userVote === '反对') {
    result.userScore = -result.ideTotalScore * 0.5;
  }
  
  // 判断法定人数
  const quorumRequirements = { '一级': 2, '二级': 3, '三级': 8 };
  const required = quorumRequirements[result.level] || 2;
  const participatingIdeVotes = result.ideVotes.filter(v => v.attitude !== '弃权').length;
  result.quorumMet = participatingIdeVotes >= required;
  
  // 判断是否通过
  const totalScore = result.ideTotalScore + result.userScore;
  const oppositionCount = result.ideVotes.filter(v => v.attitude === '反对').length +
                         (result.userVote === '反对' ? 1 : 0);
  
  // 二级决议需要用户参与
  const userParticipationRequired = result.level === '二级';
  const userParticipated = result.userVote !== null;
  
  result.passed = result.quorumMet && 
                  totalScore > oppositionCount && 
                  (!userParticipationRequired || userParticipated);
  
  return result;
}

/**
 * 扫描所有提案
 */
function scanProposals(votesDir) {
  const files = fs.readdirSync(votesDir)
    .filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
  
  const proposals = files.map(file => {
    const filePath = path.join(votesDir, file);
    return extractVotes(filePath);
  });
  
  return proposals;
}

/**
 * 主函数
 */
function main() {
  const votesDir = path.join(__dirname, '..', 'votes');
  const proposals = scanProposals(votesDir);
  
  // 输出 JSON 报告
  const report = {
    timestamp: new Date().toISOString(),
    totalProposals: proposals.length,
    passedProposals: proposals.filter(p => p.passed).length,
    pendingProposals: proposals.filter(p => !p.passed && p.status !== '已拒绝').length,
    proposals: proposals
  };
  
  console.log(JSON.stringify(report, null, 2));
  
  // 如果是 GitHub Actions，设置输出
  if (process.env.GITHUB_OUTPUT) {
    const output = Object.entries(report)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
    fs.writeFileSync(process.env.GITHUB_OUTPUT, output);
  }
}

main();
