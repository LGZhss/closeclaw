import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProcessExecutor } from "../src/sandbox/process-executor.js";
import fs from "fs";

describe("ProcessExecutor", () => {
  let executor: ProcessExecutor;

  beforeEach(() => {
    executor = new ProcessExecutor();
  });

  afterEach(async () => {
    await executor.close();
    vi.restoreAllMocks();
  });

  it("should successfully execute a basic JavaScript code block and clean up temp file", async () => {
    const code = 'console.log("hello world");';
    const result = await executor.execute(code);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("hello world");
    expect(result.stderr).toBe("");
  });

  it("should execute a shell command successfully", async () => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "echo hello" : 'echo "hello"';
    const result = await executor.executeCommand(cmd);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("hello");
  });

  it("should handle code execution errors gracefully", async () => {
    const code = 'throw new Error("crash");';
    const result = await executor.execute(code);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("crash");
  });

  it("should ensure asynchronous unlink handles ENOENT properly", async () => {
    const unlinkSpy = vi.spyOn(fs.promises, "unlink");
    const code = 'console.log("testing async cleanup");';
    await executor.execute(code);

    // Verify unlink was called to clean up the temporary file
    expect(unlinkSpy).toHaveBeenCalled();
    const calledPath = unlinkSpy.mock.calls[0][0];
    expect(calledPath).toMatch(/temp_exec_/);

    // Verify the file was indeed removed
    const fileExists = fs.existsSync(calledPath as string);
    expect(fileExists).toBe(false);
  });
});
