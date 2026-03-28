import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProcessExecutor } from '../src/sandbox/process-executor.js';
import fs from 'fs';
import path from 'path';

describe('ProcessExecutor', () => {
  let executor: ProcessExecutor;

  beforeEach(() => {
    executor = new ProcessExecutor();
    // suppress logger error output during test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await executor.close();
    vi.restoreAllMocks();
  });

  it('should successfully execute valid code asynchronously and clean up files', async () => {
    const code = 'console.log("hello test");';

    // Create a mock spy to observe fs.promises.writeFile
    const writeFileSpy = vi.spyOn(fs.promises, 'writeFile');
    const unlinkSpy = vi.spyOn(fs.promises, 'unlink');

    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello test');

    expect(writeFileSpy).toHaveBeenCalled();
    expect(unlinkSpy).toHaveBeenCalled();
  });

  it('should cleanly handle execution errors and ensure temp file is removed asynchronously', async () => {
    const code = 'throw new Error("test error");';

    const unlinkSpy = vi.spyOn(fs.promises, 'unlink');

    const result = await executor.execute(code);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('test error');

    expect(unlinkSpy).toHaveBeenCalled();
  });

  it('should cleanly handle internal FS error by propagating it', async () => {
     const code = 'console.log("wont execute");';
     const errorMsg = 'Mock fs.promises.writeFile failure';

     const writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockRejectedValueOnce(new Error(errorMsg));

     await expect(executor.execute(code)).rejects.toThrow(errorMsg);

     expect(writeFileSpy).toHaveBeenCalled();
  });
});
