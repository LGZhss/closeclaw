import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { ProcessExecutor } from '../src/sandbox/process-executor.js';
import { logger } from '../src/logger.js';

// Mock all external modules
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('fs', () => ({
  default: {
    promises: {
      writeFile: vi.fn(),
      unlink: vi.fn(),
    },
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}));

describe('ProcessExecutor', () => {
  let executor: ProcessExecutor;

  beforeEach(() => {
    // Suppress logs to avoid console spam during tests
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    executor = new ProcessExecutor();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute()', () => {
    it('should successfully execute code and cleanup temporary files asynchronously', async () => {
      // Mock child_process.spawn success behavior
      const mockChildProcess = {
        stdout: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('hello')); }) },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      (spawn as any).mockReturnValue(mockChildProcess);

      // Mock fs.promises.writeFile to succeed
      (fs.promises.writeFile as any).mockResolvedValue(undefined);
      // Mock fs.promises.unlink to succeed
      (fs.promises.unlink as any).mockResolvedValue(undefined);

      const code = 'console.log("hello");';
      const result = await executor.execute(code);

      expect(fs.promises.writeFile).toHaveBeenCalled();
      const writtenFilePath = (fs.promises.writeFile as any).mock.calls[0][0];
      expect(writtenFilePath).toMatch(/temp_exec_.*\.js$/);

      expect(spawn).toHaveBeenCalledWith('node', [writtenFilePath], expect.any(Object));

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('hello');

      // Verification that the cleanup happened asynchronously
      expect(fs.promises.unlink).toHaveBeenCalledWith(writtenFilePath);
    });

    it('should ensure cleanup happens even if process execution fails', async () => {
      // Mock child_process.spawn to emit an error
      const mockChildProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'error') {
            setTimeout(() => cb(new Error('Spawn failed')), 10);
          }
        }),
        kill: vi.fn(),
      };
      (spawn as any).mockReturnValue(mockChildProcess);

      (fs.promises.writeFile as any).mockResolvedValue(undefined);
      (fs.promises.unlink as any).mockResolvedValue(undefined);

      await expect(executor.execute('bad code')).rejects.toThrow('Spawn failed');

      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should handle unlink failures gracefully', async () => {
      // Mock child_process.spawn success
      const mockChildProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      (spawn as any).mockReturnValue(mockChildProcess);

      (fs.promises.writeFile as any).mockResolvedValue(undefined);
      // Mock unlink to throw (e.g., file not found)
      (fs.promises.unlink as any).mockRejectedValue(new Error('unlink failed'));

      // Execution should still succeed without throwing
      const result = await executor.execute('console.log("test")');

      expect(result.exitCode).toBe(0);
      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('executeCommand()', () => {
    it('should successfully execute a command', async () => {
      const mockChildProcess = {
        stdout: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('cmd result')); }) },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      (spawn as any).mockReturnValue(mockChildProcess);

      const result = await executor.executeCommand('echo "cmd result"');

      expect(spawn).toHaveBeenCalled();
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('cmd result');
    });
  });

  describe('Lifecycle methods', () => {
    it('should properly track and kill running processes', async () => {
      const mockChildProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };
      (spawn as any).mockReturnValue(mockChildProcess);

      // We start a command but it doesn't immediately close
      executor.executeCommand('sleep 10');

      expect(executor.getRunningProcessesCount()).toBe(1);

      await executor.close();

      expect(mockChildProcess.kill).toHaveBeenCalled();
      expect(executor.getRunningProcessesCount()).toBe(0);
    });
  });
});
