import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ProcessExecutor } from "../src/sandbox/process-executor.js";
import fsPromises from "fs/promises";
import { ChildProcess } from "child_process";

describe("ProcessExecutor", () => {
  let executor: ProcessExecutor;

  beforeEach(() => {
    executor = new ProcessExecutor();
  });

  afterEach(async () => {
    await executor.close();
  });

  it("should successfully execute JavaScript code using the execute method", async () => {
    const code = 'console.log("hello from sandbox");';
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("hello from sandbox");
    expect(result.stderr).toBe("");
  });

  it("should handle execution errors in the code correctly", async () => {
    const code = 'throw new Error("sandbox error");';
    const result = await executor.execute(code);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("sandbox error");
  });

  it("should execute system commands correctly", async () => {
    const command = 'echo "hello from command"';
    const result = await executor.executeCommand(command);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toContain("hello from command");
  });

  it("should execute system commands correctly on win32", async () => {
    const origPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });

    // Test that win32 branching works properly in executeCommand
    const command = 'echo hello from command win32';
    // We just mock _executeProcess since we only want to test the branch logic
    const spy = vi.spyOn(executor as any, '_executeProcess').mockResolvedValue({
      stdout: "hello from command win32",
      stderr: "",
      exitCode: 0
    });

    await executor.executeCommand(command);
    expect(spy).toHaveBeenCalledWith(
        "cmd.exe",
        ["/c", command],
        expect.anything(),
        expect.any(String),
        command
    );

    if (origPlatform) {
        Object.defineProperty(process, 'platform', origPlatform);
    }
  });

  it("should generate executionId properly if not provided in _executeProcess", async () => {
    const spy = vi.spyOn(executor as any, '_executeProcess');
    const command = 'echo hello';
    await executor.executeCommand(command);
    // It should be passed the generated ID from executeCommand
    const callArgs = spy.mock.calls[0];
    expect(callArgs[3]).toMatch(/^exec_/);

    // Now explicitly test _executeProcess with no ID provided
    const _executor = executor as any;
    const promise = _executor._executeProcess(
        "node",
        ["-e", 'console.log("hello")'],
        {}
    );
    const res = await promise;
    expect(res.exitCode).toBe(0);
  });

  it("should reject code that exceeds MAX_CODE_SIZE", async () => {
    const largeCode = "a".repeat(10240 + 1);
    await expect(executor.execute(largeCode)).rejects.toThrow(/Code too large/);
  });

  it("should stop a running execution", async () => {
    const code = 'setTimeout(() => console.log("done"), 2000);';
    const execPromise = executor.execute(code);

    await new Promise(r => setTimeout(r, 100));

    const runningMap = (executor as any).runningProcesses;
    const executionIds = Array.from(runningMap.keys());
    expect(executionIds.length).toBe(1);
    const executionId = executionIds[0] as string;

    const stopped = await executor.stop(executionId);
    expect(stopped).toBe(true);

    expect(executor.getRunningProcessesCount()).toBe(0);

    await execPromise.catch(() => {});
  });

  it("should return false when stopping a non-existent execution", async () => {
    const stopped = await executor.stop("non-existent-id");
    expect(stopped).toBe(false);
  });

  it("should handle errors when stopping execution", async () => {
    const code = 'setTimeout(() => console.log("done"), 2000);';
    const execPromise = executor.execute(code);
    await new Promise(r => setTimeout(r, 100));

    const runningMap = (executor as any).runningProcesses;
    const executionIds = Array.from(runningMap.keys());
    const executionId = executionIds[0] as string;

    const mockChildProcess = runningMap.get(executionId);
    vi.spyOn(mockChildProcess, 'kill').mockImplementation(() => {
      throw "string error kill failed";
    });

    const stopped = await executor.stop(executionId);
    expect(stopped).toBe(false);

    vi.restoreAllMocks();
    mockChildProcess.kill();

    await execPromise.catch(() => {});
  });

  it("should fail gracefully if fsPromises.unlink throws a non-ENOENT error in execute", async () => {
    vi.spyOn(fsPromises, 'unlink').mockRejectedValueOnce(new Error("Fake unlink error"));
    const code = 'console.log("unlink error test");';
    const result = await executor.execute(code);
    expect(result.exitCode).toBe(0);
    vi.restoreAllMocks();
  });

  it("should fail gracefully if fsPromises.unlink throws a non-ENOENT error in _executeProcess error handler", async () => {
    const code = 'console.log("error test");';
    const execPromise = executor.execute(code);

    let mockChildProcess: any;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 10));
        const runningMap = (executor as any).runningProcesses;
        const executionIds = Array.from(runningMap.keys());
        if (executionIds.length > 0) {
            mockChildProcess = runningMap.get(executionIds[0]);
            break;
        }
    }

    expect(mockChildProcess).toBeDefined();

    vi.spyOn(fsPromises, 'unlink').mockRejectedValueOnce(new Error("Fake process error unlink"));
    mockChildProcess.emit("error", new Error("Spawn failure"));

    await expect(execPromise).rejects.toThrow("Spawn failure");

    vi.restoreAllMocks();
  });

  it("should test timeout in executeCommand", async () => {
    const command = process.platform === "win32" ? 'timeout 2' : 'sleep 2';
    await expect(executor.executeCommand(command, { timeout: 500 })).rejects.toThrow(/命令执行超时/);
  });

  it("should test _executeProcess error cleanup where fsPromises.unlink throws an ENOENT code", async () => {
    const code = 'console.log("error enoent test");';
    const execPromise = executor.execute(code);

    let mockChildProcess: any;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 10));
        const runningMap = (executor as any).runningProcesses;
        const executionIds = Array.from(runningMap.keys());
        if (executionIds.length > 0) {
            mockChildProcess = runningMap.get(executionIds[0]);
            break;
        }
    }

    expect(mockChildProcess).toBeDefined();

    const enoentError = new Error("ENOENT Error") as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT';
    vi.spyOn(fsPromises, 'unlink').mockRejectedValueOnce(enoentError);
    mockChildProcess.emit("error", new Error("Spawn failure ENOENT"));

    await expect(execPromise).rejects.toThrow("Spawn failure ENOENT");

    vi.restoreAllMocks();
  });

  it("should catch close errors using string format", async () => {
    (executor as any).runningProcesses.set("fake-id", {
      kill: () => { throw "close string error"; }
    });

    await executor.close();
    expect(executor.getRunningProcessesCount()).toBe(0);
  });
});
