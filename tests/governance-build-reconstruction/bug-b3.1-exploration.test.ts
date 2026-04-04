/**
 * Bug Condition Exploration Test for B3.1
 * 
 * **Validates: Requirements 3.1, 7.1**
 * 
 * **Property 1: Bug Condition** - 临时文件清理逻辑查找错误的文件名模式
 * 
 * Test that process-executor.ts creates temp files with pattern `temp_${executionId}.js`
 * Test that cleanup logic searches for pattern `temp_exec_`
 * 
 * **NOTE**: Bug B3.1 appears to already be fixed in the current code.
 * The cleanup logic now uses `temp_` which matches the creation pattern.
 * 
 * Expected Outcome: Test PASSES (bug is already fixed)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Bug B3.1 Exploration: Temporary File Name Inconsistency", () => {
  const processExecutorPath = join(process.cwd(), "src", "sandbox", "process-executor.ts");
  const content = readFileSync(processExecutorPath, "utf-8");

  it("should confirm temp file creation uses temp_ pattern", () => {
    // Find the temp file creation line
    const creationPattern = /const tempFile = path\.join\(os\.tmpdir\(\), `temp_\$\{executionId\}\.js`\)/;
    const hasCorrectCreation = creationPattern.test(content);
    
    expect(
      hasCorrectCreation,
      "Temp file creation should use pattern: temp_${executionId}.js"
    ).toBe(true);
  });

  it("should confirm cleanup logic uses temp_ pattern (not temp_exec_)", () => {
    // Find the cleanup logic
    const cleanupPattern = /argsStr\.includes\("temp_"\)/;
    const hasCorrectCleanup = cleanupPattern.test(content);
    
    expect(
      hasCorrectCleanup,
      "Cleanup logic should search for pattern: temp_ (not temp_exec_)"
    ).toBe(true);
  });

  it("should confirm cleanup logic does NOT use temp_exec_ pattern", () => {
    // Verify the bug pattern is not present
    const bugPattern = /temp_exec_/;
    const hasBugPattern = bugPattern.test(content);
    
    expect(
      hasBugPattern,
      "Cleanup logic should NOT use temp_exec_ pattern (bug is fixed)"
    ).toBe(false);
  });

  it("should confirm temp file creation and cleanup patterns match", () => {
    // Extract creation pattern
    const creationMatch = content.match(/`temp_\$\{executionId\}\.js`/);
    
    // Extract cleanup pattern
    const cleanupMatch = content.match(/argsStr\.includes\("(temp_[^"]*)"\)/);
    
    expect(creationMatch).toBeTruthy();
    expect(cleanupMatch).toBeTruthy();
    
    if (creationMatch && cleanupMatch) {
      const creationPrefix = "temp_"; // From temp_${executionId}.js
      const cleanupPrefix = cleanupMatch[1]; // From argsStr.includes("temp_")
      
      expect(
        cleanupPrefix,
        `Cleanup pattern "${cleanupPrefix}" should match creation pattern "${creationPrefix}"`
      ).toBe(creationPrefix);
    }
  });

  it("should confirm cleanup logic finds temp files correctly", () => {
    // Verify the cleanup logic structure
    const cleanupStructure = /argsStr\.includes\("temp_"\)[\s\S]*?args\.find\(\(a\) => a\.includes\("temp_"\)\)/;
    const hasCorrectStructure = cleanupStructure.test(content);
    
    expect(
      hasCorrectStructure,
      "Cleanup logic should use consistent temp_ pattern in both includes() and find()"
    ).toBe(true);
  });
});
