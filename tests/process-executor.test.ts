import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProcessExecutor } from "../src/sandbox/process-executor.js";

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
});
