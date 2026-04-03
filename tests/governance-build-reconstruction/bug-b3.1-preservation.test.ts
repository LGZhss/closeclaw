/**
 * Preservation Property Tests for B3.1
 *
 * **Validates: Requirements 9.4**
 *
 * **Property 2: Preservation** - 代码执行功能继续正常工作
 *
 * Test that ProcessExecutor.execute() continues to work correctly
 * Test that code execution results are correct
 *
 * Expected Outcome on UNFIXED code: Tests PASS (confirms baseline behavior to preserve)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProcessExecutor } from "../../src/sandbox/process-executor.js";
import type { ExecutionResult } from "../../src/sandbox/process-executor.js";

describe("Bug B3.1 Preservation: Code Execution Functionality", () => {
  let executor: ProcessExecutor;

  beforeEach(() => {
    executor = new ProcessExecutor();
  });

  afterEach(async () => {
    await executor.close();
  });

  it("should successfully execute simple JavaScript code", async () => {
    // Observe: Basic code execution should work on unfixed code
    const code = `console.log("Hello, World!");`;

    const result: ExecutionResult = await executor.execute(code);

    expect(result).toBeDefined();
    expect(result.stdout).toContain("Hello, World!");
    expect(result.exitCode).toBe(0);
  });

  it("should return correct stdout from executed code", async () => {
    // Observe: stdout capture should work correctly on unfixed code
    const code = `
      console.log("Line 1");
      console.log("Line 2");
      console.log("Line 3");
    `;

    const result: ExecutionResult = await executor.execute(code);

    expect(result.stdout).toContain("Line 1");
    expect(result.stdout).toContain("Line 2");
    expect(result.stdout).toContain("Line 3");
    expect(result.exitCode).toBe(0);
  });

  it("should return correct stderr from executed code", async () => {
    // Observe: stderr capture should work correctly on unfixed code
    const code = `
      console.error("Error message");
    `;

    const result: ExecutionResult = await executor.execute(code);

    expect(result.stderr).toContain("Error message");
    expect(result.exitCode).toBe(0);
  });

  it("should return non-zero exit code for code with errors", async () => {
    // Observe: Error handling should work correctly on unfixed code
    const code = `
      throw new Error("Test error");
    `;

    const result: ExecutionResult = await executor.execute(code);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Error");
  });

  it("should execute code with mathematical operations correctly", async () => {
    // Observe: Complex code execution should work on unfixed code
    const code = `
      const result = 2 + 2;
      console.log("Result:", result);
    `;

    const result: ExecutionResult = await executor.execute(code);

    expect(result.stdout).toContain("Result: 4");
    expect(result.exitCode).toBe(0);
  });

  it("should handle code with variables and functions", async () => {
    // Observe: Function execution should work on unfixed code
    const code = `
      function greet(name) {
        return "Hello, " + name;
      }
      console.log(greet("Test"));
    `;

    const result: ExecutionResult = await executor.execute(code);

    expect(result.stdout).toContain("Hello, Test");
    expect(result.exitCode).toBe(0);
  });

  it("should reject code that exceeds MAX_CODE_SIZE", async () => {
    // Observe: Size validation should work on unfixed code
    const largeCode = "console.log('x');\n".repeat(1000); // > 10KB

    await expect(executor.execute(largeCode)).rejects.toThrow("Code too large");
  });

  it("should handle empty code execution", async () => {
    // Observe: Empty code should execute without errors on unfixed code
    const code = ``;

    const result: ExecutionResult = await executor.execute(code);

    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
  });

  it("should execute code with async operations", async () => {
    // Observe: Async code execution should work on unfixed code
    const code = `
      (async () => {
        await Promise.resolve();
        console.log("Async complete");
      })();
    `;

    const result: ExecutionResult = await executor.execute(code);

    expect(result.exitCode).toBe(0);
  });

  it("should preserve ExecutionResult structure", async () => {
    // Observe: Result structure should remain consistent on unfixed code
    const code = `console.log("test");`;

    const result: ExecutionResult = await executor.execute(code);

    // Verify result has expected properties
    expect(result).toHaveProperty("stdout");
    expect(result).toHaveProperty("stderr");
    expect(result).toHaveProperty("exitCode");

    // Verify property types
    expect(typeof result.stdout).toBe("string");
    expect(typeof result.stderr).toBe("string");
    expect(
      typeof result.exitCode === "number" || result.exitCode === null,
    ).toBe(true);
  });

  it("should handle multiple sequential executions", async () => {
    // Observe: Multiple executions should work on unfixed code
    const code1 = `console.log("First");`;
    const code2 = `console.log("Second");`;
    const code3 = `console.log("Third");`;

    const result1 = await executor.execute(code1);
    const result2 = await executor.execute(code2);
    const result3 = await executor.execute(code3);

    expect(result1.stdout).toContain("First");
    expect(result2.stdout).toContain("Second");
    expect(result3.stdout).toContain("Third");

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);
    expect(result3.exitCode).toBe(0);
  });

  it("should preserve timeout functionality", async () => {
    // Observe: Timeout option should work on unfixed code
    const code = `
      // Infinite loop
      while(true) {}
    `;

    // Should timeout and reject
    await expect(executor.execute(code, { timeout: 1000 })).rejects.toThrow();
  });

  it("should preserve ProcessExecutor instance methods", async () => {
    // Observe: All instance methods should be available on unfixed code
    expect(typeof executor.execute).toBe("function");
    expect(typeof executor.executeCommand).toBe("function");
    expect(typeof executor.stop).toBe("function");
    expect(typeof executor.close).toBe("function");
    expect(typeof executor.getRunningProcessesCount).toBe("function");
  });

  it("should track running processes count correctly", async () => {
    // Observe: Process tracking should work on unfixed code
    const initialCount = executor.getRunningProcessesCount();
    expect(initialCount).toBe(0);

    // Execute code
    const code = `console.log("test");`;
    await executor.execute(code);

    // After execution completes, count should return to 0
    const finalCount = executor.getRunningProcessesCount();
    expect(finalCount).toBe(0);
  });
});
