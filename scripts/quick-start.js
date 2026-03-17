#!/usr/bin/env node
/**
 * scripts/quick-start.js
 * CloseClaw 一键快速启动脚本（提案 017）
 * 自动检查环境 → 安装依赖 → 构建 → 启动
 * 实施主体: Verdent (Claude Sonnet 4.6)
 * 关联提案: votes/proposal-017-quick-start-scripts.md
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', dim: '\x1b[2m',
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const SKIP_BUILD = args.includes('--skip-build');

function step(n, total, msg) {
  console.log(`\n${C.bold}${C.cyan}[${n}/${total}] ${msg}${C.reset}`);
}

function run(cmd, opts = {}) {
  if (VERBOSE || DRY_RUN) console.log(`  ${C.dim}$ ${cmd}${C.reset}`);
  if (DRY_RUN) return;
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
  } catch (e) {
    console.error(`\n${C.red}✘ 命令失败: ${cmd}${C.reset}`);
    console.error(`  ${e.message}`);
    process.exit(1);
  }
}

function runCheck(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════╗`);
console.log(`║   CloseClaw 快速启动 v1.0        ║`);
console.log(`╚══════════════════════════════════╝${C.reset}`);
if (DRY_RUN) console.log(`${C.yellow}  [--dry-run 模式，仅预览步骤]${C.reset}`);

const TOTAL_STEPS = SKIP_BUILD ? 4 : 5;

// ── Step 1: 环境检查 ──────────────────────────────
step(1, TOTAL_STEPS, '环境检查');
const nodeVer = runCheck('node --version');
if (!nodeVer) {
  console.error(`${C.red}✘ Node.js 未安装，请访问 https://nodejs.org${C.reset}`);
  process.exit(1);
}
const [major] = nodeVer.replace('v', '').split('.').map(Number);
if (major < 20) {
  console.error(`${C.red}✘ Node.js ${nodeVer} 版本过低，需要 ≥ 20.0.0${C.reset}`);
  process.exit(1);
}
console.log(`  ${C.green}✔${C.reset} Node.js ${nodeVer}`);

const npmVer = runCheck('npm --version');
console.log(npmVer
  ? `  ${C.green}✔${C.reset} npm v${npmVer}`
  : `  ${C.red}✘ npm 未安装${C.reset}`);

// ── Step 2: 初始化 .env ───────────────────────────
step(2, TOTAL_STEPS, '初始化环境配置');
if (!existsSync(join(ROOT, '.env'))) {
  if (existsSync(join(ROOT, '.env.example'))) {
    console.log(`  ${C.yellow}⚠ 未找到 .env，正在从 .env.example 复制...${C.reset}`);
    run('cp .env.example .env');
    console.log(`  ${C.green}✔${C.reset} .env 已创建，请按需修改配置`);
  } else {
    console.log(`  ${C.yellow}⚠ 未找到 .env 和 .env.example，使用默认配置${C.reset}`);
  }
} else {
  console.log(`  ${C.green}✔${C.reset} .env 已存在`);
}

// ── Step 3: 安装依赖 ──────────────────────────────
step(3, TOTAL_STEPS, '安装 npm 依赖');
if (existsSync(join(ROOT, 'node_modules'))) {
  console.log(`  ${C.green}✔${C.reset} node_modules 已存在，跳过安装（使用 --force-install 强制重装）`);
  if (args.includes('--force-install')) {
    run('npm install');
  }
} else {
  run('npm install');
  console.log(`  ${C.green}✔${C.reset} 依赖安装完成`);
}

// ── Step 4: 构建 TypeScript ───────────────────────
if (!SKIP_BUILD) {
  step(4, TOTAL_STEPS, '构建 TypeScript');
  run('npm run build');
  console.log(`  ${C.green}✔${C.reset} 构建完成`);
}

// ── Step 5: 启动 ──────────────────────────────────
step(TOTAL_STEPS, TOTAL_STEPS, '启动 CloseClaw');
console.log(`  ${C.cyan}→${C.reset} 正在启动系统...\n`);

if (DRY_RUN) {
  console.log(`  ${C.dim}$ npm start${C.reset}`);
  console.log(`\n${C.green}${C.bold}✔ [dry-run] 所有步骤检查通过${C.reset}\n`);
  process.exit(0);
}

// 用 spawn 替代 execSync，保持进程持续运行
const child = spawn('npm', ['start'], { cwd: ROOT, stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
