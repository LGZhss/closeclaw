/**
 * CloseClaw Setup Script
 * Guides users through first-time installation
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Check if a command exists
 */
async function checkCommand(command: string): Promise<boolean> {
  const { spawn } = await import('child_process');
  return new Promise((resolve) => {
    const proc = spawn(command, ['--version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Check environment requirements
 */
async function checkEnvironment(): Promise<boolean> {
  log('\n🔍 Checking environment requirements...\n', colors.blue);

  const requirements = [
    { name: 'Node.js 20+', check: async () => process.version.startsWith('v20') || process.version.startsWith('v21') || process.version.startsWith('v22') },
    { name: 'Docker', check: async () => await checkCommand('docker') },
    { name: 'npm', check: async () => await checkCommand('npm') },
  ];

  let allPassed = true;

  for (const req of requirements) {
    try {
      const passed = await req.check();
      if (passed) {
        log(`  ✓ ${req.name}`, colors.green);
      } else {
        log(`  ✗ ${req.name} - NOT FOUND`, colors.red);
        allPassed = false;
      }
    } catch (error) {
      log(`  ✗ ${req.name} - ERROR: ${error}`, colors.red);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Setup .env file
 */
function setupEnvFile(): void {
  log('\n📝 Setting up environment file...\n', colors.blue);

  const envPath = path.join(PROJECT_ROOT, '.env');
  const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

  if (!existsSync(envPath)) {
    if (existsSync(envExamplePath)) {
      copyFileSync(envExamplePath, envPath);
      log('  ✓ Created .env file from .env.example', colors.green);
      log('  ⚠  Please edit .env and add your API keys', colors.yellow);
    } else {
      log('  ⚠  .env.example not found, creating basic .env', colors.yellow);
      const content = `# CloseClaw Environment Configuration\nANTHROPIC_API_KEY=your-api-key-here\nASSISTANT_NAME=Andy\n`;
      writeFileSync(envPath, content);
    }
  } else {
    log('  ✓ .env file already exists', colors.green);
  }
}

/**
 * Install dependencies
 */
async function installDependencies(): Promise<void> {
  log('\n📦 Installing dependencies...\n', colors.blue);

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    await execAsync('npm install', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    log('  ✓ Dependencies installed', colors.green);
  } catch (error) {
    log(`  ✗ Failed to install dependencies: ${error}`, colors.red);
    throw error;
  }
}

/**
 * Build container image
 */
async function buildContainer(): Promise<void> {
  log('\n🐳 Building container image...\n', colors.blue);

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const buildScript = path.join(PROJECT_ROOT, 'container', 'build.sh');
    if (existsSync(buildScript)) {
      await execAsync(`bash ${buildScript}`, { cwd: PROJECT_ROOT, stdio: 'inherit' });
    } else {
      // Build directly
      await execAsync('docker build -t closeclaw-agent:latest ./container', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      });
    }
    log('  ✓ Container image built', colors.green);
  } catch (error) {
    log(`  ⚠  Failed to build container: ${error}`, colors.yellow);
    log('  You can build it later with: npm run build:container', colors.dim);
  }
}

/**
 * Create necessary directories
 */
function createDirectories(): void {
  log('\n📁 Creating directories...\n', colors.blue);

  const dirs = [
    'store',
    'data',
    'data/sessions',
    'data/ipc',
    'data/env',
    'groups',
    'groups/main',
    'groups/global',
    'logs',
  ];

  for (const dir of dirs) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      log(`  ✓ Created ${dir}`, colors.green);
    } else {
      log(`  ✓ ${dir} already exists`, colors.green);
    }
  }
}

/**
 * Create CONTEXT.md files for groups
 */
function createContextMdFiles(): void {
  log('\n📝 Creating CONTEXT.md files...\n', colors.blue);

  const globalPath = path.join(PROJECT_ROOT, 'groups', 'global', 'CONTEXT.md');
  const mainPath = path.join(PROJECT_ROOT, 'groups', 'main', 'CONTEXT.md');

  if (!existsSync(globalPath)) {
    const globalContent = `# Global Memory

This file contains global preferences, facts, and context shared across all conversations.

## Preferences
- Be concise and helpful
- Use Chinese for responses

## Facts
- User prefers practical solutions over theoretical discussions
`;
    writeFileSync(globalPath, globalContent);
    log('  ✓ Created groups/global/CONTEXT.md', colors.green);
  }

  if (!existsSync(mainPath)) {
    const mainContent = `# Main Channel Memory

This file contains memory and context specific to the main channel (self-chat).

## Recent Context
- Setup completed on ${new Date().toISOString()}
`;
    writeFileSync(mainPath, mainContent);
    log('  ✓ Created groups/main/CONTEXT.md', colors.green);
  }
}

/**
 * Display next steps
 */
function displayNextSteps(): void {
  log('\n' + '='.repeat(50), colors.bright);
  log('✅ Setup completed!', colors.green);
  log('='.repeat(50), colors.bright);
  log('\n📚 Next steps:\n', colors.blue);
  log('1. Edit .env file and add your API keys:');
  log('   - ANTHROPIC_API_KEY (required)', colors.yellow);
  log('   - TELEGRAM_TOKEN (optional, for Telegram channel)', colors.dim);
  log('   - Other channel credentials (optional)', colors.dim);
  log('\n2. Start CloseClaw:', colors.blue);
  log('   npm start', colors.bright);
  log('\n3. For development mode with auto-reload:', colors.blue);
  log('   npm run dev', colors.bright);
  log('\n4. Add channels via skills (coming soon):', colors.blue);
  log('   - /add-telegram', colors.dim);
  log('   - /add-whatsapp', colors.dim);
  log('   - /add-slack', colors.dim);
  log('\n5. Talk to your assistant:', colors.blue);
  log(`   @Andy Hello!`, colors.bright);
  log('\n' + '='.repeat(50), colors.bright);
}

/**
 * Main setup function
 */
async function main(): Promise<void> {
  log('\n' + '='.repeat(50), colors.bright);
  log('🚀 CloseClaw Setup', colors.bright);
  log('='.repeat(50) + '\n', colors.bright);

  try {
    // Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      log('\n⚠  Some requirements are missing. Please install them and run setup again.', colors.yellow);
      log('\nRequired:', colors.bright);
      log('  - Node.js 20 or higher', colors.dim);
      log('  - Docker (for container isolation)', colors.dim);
      log('  - npm (comes with Node.js)', colors.dim);
      return;
    }

    // Create directories
    createDirectories();

    // Setup .env file
    setupEnvFile();

    // Install dependencies
    await installDependencies();

    // Create CONTEXT.md files
    createContextMdFiles();

    // Build container (optional)
    await buildContainer();

    // Display next steps
    displayNextSteps();
  } catch (error) {
    log(`\n❌ Setup failed: ${error}`, colors.red);
    log('\nPlease check the error message above and try again.', colors.yellow);
    process.exit(1);
  }
}

// Run setup
main().catch((error) => {
  log(`Fatal error: ${error}`, colors.red);
  process.exit(1);
});
