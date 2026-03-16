#!/usr/bin/env node
/**
 * scripts/dev.js
 * CloseClaw 开发模式启动脚本（提案 017）
 * 带热重载的开发服务器 + 可选测试监视模式
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
  yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m',
  bold: '\x1b[1m', dim: '\x1b[2m',
};

const args = process.argv.slice(2);
const WITH_TESTS = args.includes('--with-tests');   // 同时启动 vitest watch
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

function runCheck(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim(); }
  catch { return null; }
}

console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════╗`);
console.log(`║   CloseClaw 开发模式 v1.0        ║`);
console.log(`╚══════════════════════════════════╝${C.reset}`);
if (DRY_RUN) console.log(`${C.yellow}  [--dry-run 模式]${C.reset}`);
if (WITH_TESTS) console.log(`${C.magenta}  [--with-tests 模式: 同时启动测试监视]${C.reset}`);

// ── 前置检查 ──────────────────────────────────────
const nodeVer = runCheck('node --version');
if (!nodeVer) {
  console.error(`${C.red}✘ Node.js 未安装${C.reset}`);
  process.exit(1);
}

if (!existsSync(join(ROOT, 'node_modules'))) {
  console.log(`\n${C.yellow}  ⚠ node_modules 不存在，自动执行 npm install...${C.reset}`);
  if (!DRY_RUN) {
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  }
}

// ── 启动开发服务器 ────────────────────────────────
console.log(`\n${C.bold}[启动] 开发服务器（tsx watch）${C.reset}`);
console.log(`  ${C.dim}日志级别: debug | 热重载: 开启${C.reset}`);
console.log(`  ${C.dim}按 Ctrl+C 停止${C.reset}\n`);

if (DRY_RUN) {
  console.log(`  ${C.dim}$ npm run dev${C.reset}`);
  if (WITH_TESTS) console.log(`  ${C.dim}$ npm run test:watch${C.reset}`);
  console.log(`\n${C.green}${C.bold}✔ [dry-run] 命令预览完毕${C.reset}\n`);
  process.exit(0);
}

const processes = [];

// 主进程：tsx watch（开发热重载）
const devServer = spawn('npm', ['run', 'dev'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, LOG_LEVEL: 'debug', NODE_ENV: 'development' },
});
processes.push(devServer);
if (VERBOSE) console.log(`  ${C.dim}已启动 dev 进程 PID: ${devServer.pid}${C.reset}`);

// 可选：同时启动 vitest watch
if (WITH_TESTS) {
  console.log(`\n${C.bold}[启动] Vitest 测试监视${C.reset}`);
  const testWatcher = spawn('npm', ['run', 'test', '--', '--watch'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  processes.push(testWatcher);
  if (VERBOSE) console.log(`  ${C.dim}已启动 test 进程 PID: ${testWatcher.pid}${C.reset}`);
}

// 优雅退出：Ctrl+C 终止所有子进程
process.on('SIGINT', () => {
  console.log(`\n${C.yellow}  正在停止所有进程...${C.reset}`);
  processes.forEach((p) => { try { p.kill('SIGTERM'); } catch { /* ignore */ } });
  setTimeout(() => process.exit(0), 500);
});

processes.forEach((p) => {
  p.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${C.red}✘ 子进程以代码 ${code} 退出${C.reset}`);
    }
  });
});
