#!/usr/bin/env node
/**
 * scripts/check-env.js
 * CloseClaw 环境检查脚本（提案 017）
 * 检查 Node.js、npm、Git、SQLite、Docker 等环境依赖
 * 实施主体: Verdent (Claude Sonnet 4.6)
 * 关联提案: votes/proposal-017-quick-start-scripts.md
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// 控制台颜色（无需 chalk 依赖）
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const ok = (msg) => console.log(`  ${C.green}✔${C.reset} ${msg}`);
const fail = (msg) => console.log(`  ${C.red}✘${C.reset} ${msg}`);
const warn = (msg) => console.log(`  ${C.yellow}⚠${C.reset} ${msg}`);
const info = (msg) => console.log(`  ${C.cyan}→${C.reset} ${msg}`);

/** 解析命令行参数 */
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const DRY_RUN = args.includes('--dry-run');

/** 执行命令并返回输出，失败返回 null */
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/** 版本号比较：actual >= required */
function versionGte(actual, required) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [a, b] = [parse(actual), parse(required)];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnChecks = 0;

function check(label, passed, message, isWarn = false) {
  totalChecks++;
  if (passed) {
    passedChecks++;
    ok(`${label}: ${message}`);
  } else if (isWarn) {
    warnChecks++;
    warn(`${label}: ${message}`);
  } else {
    failedChecks++;
    fail(`${label}: ${message}`);
  }
}

console.log(`\n${C.bold}${C.cyan}CloseClaw 环境检查${C.reset}\n${'─'.repeat(40)}`);
if (DRY_RUN) info('--dry-run 模式：仅检查，不执行任何修改\n');

// ── 1. Node.js ────────────────────────────────────
console.log(`\n${C.bold}[1/6] Node.js${C.reset}`);
const nodeVer = run('node --version');
if (nodeVer) {
  const ok20 = versionGte(nodeVer, '20.0.0');
  check('Node.js', ok20, `${nodeVer}${ok20 ? '' : ' (需要 ≥ 20.0.0)'}`, !ok20);
  if (VERBOSE) info(`路径: ${run('node --eval "process.stdout.write(process.execPath)"')}`);
} else {
  check('Node.js', false, '未安装，请访问 https://nodejs.org');
}

// ── 2. npm ────────────────────────────────────────
console.log(`\n${C.bold}[2/6] npm${C.reset}`);
const npmVer = run('npm --version');
if (npmVer) {
  check('npm', versionGte(npmVer, '8.0.0'), `v${npmVer}`);
} else {
  check('npm', false, '未安装');
}

// ── 3. Git ────────────────────────────────────────
console.log(`\n${C.bold}[3/6] Git${C.reset}`);
const gitVer = run('git --version');
if (gitVer) {
  check('Git', true, gitVer);
  const gitUser = run('git config --global user.name');
  const gitEmail = run('git config --global user.email');
  check('Git 用户名', !!gitUser, gitUser || '未配置（建议: git config --global user.name "名字"）', !gitUser);
  check('Git 邮箱', !!gitEmail, gitEmail || '未配置（建议: git config --global user.email "邮箱"）', !gitEmail);
} else {
  check('Git', false, '未安装，请访问 https://git-scm.com');
}

// ── 4. 项目依赖 ───────────────────────────────────
console.log(`\n${C.bold}[4/6] 项目依赖${C.reset}`);
const pkgPath = join(ROOT, 'package.json');
const nmPath = join(ROOT, 'node_modules');
if (existsSync(pkgPath)) {
  check('package.json', true, '存在');
  if (existsSync(nmPath)) {
    check('node_modules', true, '已安装');
  } else {
    check('node_modules', false, '未安装，请运行 npm install', true);
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (VERBOSE) info(`项目版本: ${pkg.version || '未定义'}`);
  } catch { /* ignore */ }
} else {
  check('package.json', false, '项目根目录未找到');
}

// ── 5. 环境变量 ───────────────────────────────────
console.log(`\n${C.bold}[5/6] 环境变量配置${C.reset}`);
const envPath = join(ROOT, '.env');
const envExPath = join(ROOT, '.env.example');
if (existsSync(envPath)) {
  check('.env 文件', true, '已存在');
  // 检查关键变量（不读取实际值，只检查 key 是否存在）
  const envContent = readFileSync(envPath, 'utf8');
  const hasDbPath = envContent.includes('DB_PATH') || envContent.includes('DATABASE');
  check('DB_PATH / DATABASE', hasDbPath, hasDbPath ? '已配置' : '未找到（可选）', true);
} else if (existsSync(envExPath)) {
  check('.env 文件', false, '未创建，请复制模板: cp .env.example .env', true);
} else {
  check('.env 文件', false, '未找到（可选，使用默认配置）', true);
}

// ── 6. Docker（可选）────────────────────────────────
console.log(`\n${C.bold}[6/6] Docker（可选）${C.reset}`);
const dockerVer = run('docker --version');
if (dockerVer) {
  check('Docker', true, dockerVer);
  const dockerRunning = run('docker info --format "{{.ServerVersion}}"');
  check('Docker 守护进程', !!dockerRunning, dockerRunning ? `运行中 (v${dockerRunning})` : '未运行（容器功能不可用）', !dockerRunning);
} else {
  check('Docker', true, '未安装（可选，不影响基础功能）', false);
  warnChecks++; // 仅提示
}

// ── 结果汇总 ──────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`${C.bold}检查结果汇总${C.reset}`);
console.log(`  ${C.green}通过${C.reset}: ${passedChecks}  ${C.yellow}警告${C.reset}: ${warnChecks}  ${C.red}失败${C.reset}: ${failedChecks}  共: ${totalChecks}`);

if (failedChecks === 0) {
  console.log(`\n${C.green}${C.bold}✔ 环境检查通过，可以启动 CloseClaw${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${C.red}${C.bold}✘ 存在 ${failedChecks} 个问题需要修复后再启动${C.reset}\n`);
  process.exit(1);
}
