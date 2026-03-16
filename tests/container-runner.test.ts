import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runContainer, stopContainer, checkDockerAvailable } from '../src/container-runner';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

vi.mock('../src/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('container-runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runContainer', () => {
    it('should include deterministic --name flag based on groupFolder', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = vi.fn();

      // We need to trigger the close event slightly asynchronously so the process runs
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      vi.mocked(spawn).mockReturnValue(mockProcess);

      const resultPromise = runContainer({
        groupFolder: 'test-group',
        prompt: 'test prompt'
      });

      // Assert that spawn was called with the correct args
      expect(spawn).toHaveBeenCalled();
      const spawnArgs = vi.mocked(spawn).mock.calls[0];
      const dockerArgs = spawnArgs[1] as string[];

      // Check for name flag in the args array (before the 'sh', '-c' part of spawn)
      expect(dockerArgs).toContain('--name');
      expect(dockerArgs).toContain('closeclaw-test-group');

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });
  });

  describe('stopContainer', () => {
    it('should successfully stop a container (happy path)', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      vi.mocked(spawn).mockReturnValue(mockProcess);

      const result = await stopContainer('test-group');

      expect(spawn).toHaveBeenCalledWith('docker', ['rm', '-f', 'closeclaw-test-group'], expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should handle failure to stop container (error path close code)', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Error: No such container');
        mockProcess.emit('close', 1);
      }, 10);

      vi.mocked(spawn).mockReturnValue(mockProcess);

      const result = await stopContainer('test-group');

      expect(spawn).toHaveBeenCalledWith('docker', ['rm', '-f', 'closeclaw-test-group'], expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Error: No such container');
    });

    it('should handle process error event', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      setTimeout(() => {
        mockProcess.emit('error', new Error('Failed to start docker process'));
      }, 10);

      vi.mocked(spawn).mockReturnValue(mockProcess);

      const result = await stopContainer('test-group');

      expect(spawn).toHaveBeenCalledWith('docker', ['rm', '-f', 'closeclaw-test-group'], expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(-1);
      expect(result.error).toBe('Failed to start docker process');
    });
  });
});
