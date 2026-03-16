/**
 * Agent Runner - Runs inside the container
 * This is the entry point for the containerized agent
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const IPC_DIR = '/workspace/ipc';
const MESSAGES_DIR = path.join(IPC_DIR, 'messages');
const TASKS_DIR = path.join(IPC_DIR, 'tasks');

/**
 * Ensure IPC directories exist
 */
function ensureIpcDirs() {
  mkdirSync(MESSAGES_DIR, { recursive: true });
  mkdirSync(TASKS_DIR, { recursive: true });
}

/**
 * Write a message to IPC for the host to pick up
 */
function writeMessageToIPC(message: { id: string; groupFolder: string; text: string; timestamp: number }) {
  ensureIpcDirs();
  const filePath = path.join(MESSAGES_DIR, `${message.id}.json`);
  writeFileSync(filePath, JSON.stringify(message, null, 2));
}

/**
 * Write a task result to IPC
 */
function writeTaskResultToIPC(taskId: string, result: string, error?: string) {
  ensureIpcDirs();
  const filePath = path.join(TASKS_DIR, `${taskId}.json`);
  
  const task = {
    id: taskId,
    groupFolder: taskId.split('_')[0],
    prompt: '',
    status: error ? 'failed' : 'completed',
    result: error ? undefined : result,
    error: error,
    createdAt: Date.now(),
    completedAt: Date.now(),
  };

  writeFileSync(filePath, JSON.stringify(task, null, 2));
}

/**
 * Run Claude Code CLI with the given prompt
 */
async function runClaudeCode(prompt: string, sessionId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args: string[] = [];

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    args.push('--prompt', prompt);

    const claudeProcess = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: '/workspace/group',
    });

    let output = '';
    let errorOutput = '';

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    claudeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    claudeProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Claude exited with code ${code}`));
      }
    });

    claudeProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let prompt = '';
  let sessionId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' && args[i + 1]) {
      prompt = args[i + 1];
      i++;
    } else if (args[i] === '--resume' && args[i + 1]) {
      sessionId = args[i + 1];
      i++;
    }
  }

  if (!prompt) {
    console.error('Error: --prompt is required');
    process.exit(1);
  }

  try {
    console.log('Running Claude Code with prompt:', prompt.slice(0, 100) + '...');
    
    const output = await runClaudeCode(prompt, sessionId);
    
    console.log('Claude Code completed successfully');
    
    // Write result to IPC
    const taskId = process.env.TASK_ID || 'default';
    writeTaskResultToIPC(taskId, output);
    
  } catch (error) {
    console.error('Error running Claude Code:', error);
    
    // Write error to IPC
    const taskId = process.env.TASK_ID || 'default';
    writeTaskResultToIPC(taskId, '', error instanceof Error ? error.message : 'Unknown error');
    
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
