import { spawn } from 'child_process';
import path from 'path';
import { CONTAINER_IMAGE, CONTAINER_TIMEOUT, GROUPS_DIR, DATA_DIR } from './config.js';
import { logger } from './logger.js';
import { writeTaskResult, IPCMessage, IPCTask } from './ipc.js';

/**
 * Container execution result
 */
export interface ContainerResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode: number;
}

/**
 * Container runner options
 */
export interface ContainerOptions {
  groupFolder: string;
  prompt: string;
  sessionId?: string;
  timeout?: number;
  additionalMounts?: Array<{ hostPath: string; containerPath: string; readonly?: boolean }>;
}

/**
 * Run a container with the agent
 */
export async function runContainer(options: ContainerOptions): Promise<ContainerResult> {
  const { groupFolder, prompt, sessionId, timeout = CONTAINER_TIMEOUT, additionalMounts = [] } = options;

  logger.info(`Starting container for group: ${groupFolder}`);

  const groupPath = path.join(GROUPS_DIR, groupFolder);
  const sessionPath = path.join(DATA_DIR, 'sessions', groupFolder, '.claude');
  const envDir = path.join(DATA_DIR, 'env');

  // Build docker command
  const dockerArgs: string[] = [
    'run',
    '--rm',
    '-i',
  ];

  // Add volume mounts
  dockerArgs.push(
    `-v`, `${groupPath}:/workspace/group`,
    `-v`, `${sessionPath}:/home/node/.claude`,
    `-v`, `${envDir}:/workspace/env-dir`
  );

  // Add global memory mount for non-main groups
  if (!groupFolder.includes('main')) {
    const globalPath = path.join(GROUPS_DIR, 'global');
    dockerArgs.push(`-v`, `${globalPath}:/workspace/global`);
  }

  // Add additional mounts
  for (const mount of additionalMounts) {
    const mountSpec = mount.readonly
      ? [`--mount`, `type=bind,source=${mount.hostPath},target=/workspace/extra/${mount.containerPath},readonly`]
      : [`-v`, `${mount.hostPath}:/workspace/extra/${mount.containerPath}`];
    dockerArgs.push(...mountSpec);
  }

  // Add environment variables
  dockerArgs.push(
    `-e`, `ANTHROPIC_API_KEY`,
    `-e`, `CLAUDE_CODE_OAUTH_TOKEN`
  );

  // Add container image and command
  dockerArgs.push(CONTAINER_IMAGE);

  // Build the command to run inside container
  const containerCmd = buildContainerCommand(prompt, sessionId);

  try {
    const result = await executeDockerCommand(dockerArgs, containerCmd, timeout);
    logger.info(`Container completed for group: ${groupFolder}`);
    return result;
  } catch (error) {
    logger.error(`Container failed for group ${groupFolder}: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      exitCode: -1,
    };
  }
}

/**
 * Build the command to run inside the container
 */
function buildContainerCommand(prompt: string, sessionId?: string): string {
  const commands: string[] = [];

  // Source environment variables
  commands.push(`source /workspace/env-dir/env 2>/dev/null || true`);

  // Build claude command
  let claudeCmd = 'claude';
  
  if (sessionId) {
    claudeCmd += ` --resume ${sessionId}`;
  }

  claudeCmd += ` --prompt ${escapeShellArg(prompt)}`;

  commands.push(claudeCmd);

  return commands.join(' && ');
}

/**
 * Execute docker command
 */
async function executeDockerCommand(
  args: string[],
  cmd: string,
  timeout: number
): Promise<ContainerResult> {
  return new Promise((resolve, reject) => {
    const dockerProcess = spawn('docker', [...args, 'sh', '-c', cmd], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    const timeoutId = setTimeout(() => {
      dockerProcess.kill('SIGTERM');
      setTimeout(() => {
        if (dockerProcess.pid) {
          try {
            process.kill(dockerProcess.pid, 'SIGKILL');
          } catch (e) {
            // Process already dead
          }
        }
      }, 5000);
      reject(new Error('Container execution timeout'));
    }, timeout);

    dockerProcess.stdout.on('data', (data) => {
      output += data.toString();
      logger.debug(`Container stdout: ${data.toString().slice(0, 200)}`);
    });

    dockerProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      logger.debug(`Container stderr: ${data.toString().slice(0, 200)}`);
    });

    dockerProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({
        success: code === 0,
        output: output || undefined,
        error: errorOutput || undefined,
        exitCode: code || 0,
      });
    });

    dockerProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

/**
 * Escape shell argument
 */
function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Check if docker is available
 */
export async function checkDockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const dockerProcess = spawn('docker', ['--version'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    dockerProcess.on('close', (code) => {
      resolve(code === 0);
    });

    dockerProcess.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Check if container image exists
 */
export async function checkImageExists(imageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const dockerProcess = spawn('docker', ['images', '-q', imageName], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    dockerProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    dockerProcess.on('close', (code) => {
      resolve(code === 0 && output.trim().length > 0);
    });

    dockerProcess.on('error', () => {
      resolve(false);
    });
  });
}
