#!/usr/bin/env node
// Simple vote tally utility for CloseClaw governance
// Reads votes/ proposals and prints a summary. This is a lightweight starter script.

const fs = require('fs');
const path = require('path');

const VOTES_DIR = path.resolve(__dirname, '../votes');

function listProposals() {
  if (!fs.existsSync(VOTES_DIR)) return [];
  return fs.readdirSync(VOTES_DIR).filter(n => /^proposal-.*\\.md$/.test(n));
}

function parseProposal(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const header = /## 🗳️ 协作主体投票[\s\S]*?###?[^\n]*?/m;
  // Basic extraction of voting table rows
  const tableMatch = content.match(/\|/.test(content) ? content.match(/\|.*?\|/gs) : null;
  let totalSubjects = 0;
  let agreed = 0;
  if (tableMatch) {
    // crude pass: count rows with a checkmark in second column
    for (const line of tableMatch) {
      // skip header lines
      if (!line.includes('|')) continue;
      const cols = line.split('|').map(s => s.trim());
      if (cols.length >= 4 && (cols[1] === '⬜ 赞同' || cols[1] === '✅ 赞同' || cols[2] === '+1')) {
        totalSubjects++;
        if (cols[1].includes('✅') || cols[2].includes('+1')) agreed++;
      } else if (cols[1] && cols[1].toLowerCase().includes('赞同')) {
        totalSubjects++;
      }
    }
  }
  return { filePath, totalSubjects, agreed };
}

function main(){
  const projs = listProposals();
  if (projs.length === 0) {
    console.log('No proposals found in votes/.');
    process.exit(0);
  }
  for (const p of projs) {
    const res = parseProposal(path.join(VOTES_DIR, p));
    console.log(`Proposal: ${p}`);
    console.log(`  Total Subjects: ${res.totalSubjects}`);
    console.log(`  Agreed: ${res.agreed}`);
  }
}

main();
