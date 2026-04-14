/**
 * Bug Condition Exploration Test for B3.1
 * 
 * **Validates: Requirements 3.1, 7.1**
 * 
 * **Property 1: Bug Condition** - 临时文件清理逻辑依赖字符串模式推断临时文件路径
 * 
 * Test that process-executor.ts creates temp files with pattern `temp_${executionId}.js`
 * Test that cleanup logic no longer relies on scanning args for `temp_` pattern
 * 
 * **NOTE**: Current implementation passes temp file path explicitly to `_executeProcess`.
 * 
 * Expected Outcome: Test PASSES (bug is already fixed)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Bug B3.1 Exploration: Temporary File Cleanup Robustness", () => {
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

  it("should pass tempFile explicitly into _executeProcess", () => {
    const explicitPassPattern = /this\._executeProcess\([\s\S]*?tempFile[\s\S]*?\)/;
    const hasExplicitPass = explicitPassPattern.test(content);
    
    expect(
      hasExplicitPass,
      "execute() should pass tempFile explicitly to _executeProcess"
    ).toBe(true);
  });

  it("should define tempFilePath parameter in _executeProcess", () => {
    const signaturePattern = /tempFilePath:\s*string\s*\|\s*null\s*=\s*null/;
    const hasSignature = signaturePattern.test(content);
    
    expect(
      hasSignature,
      "_executeProcess should define tempFilePath parameter"
    ).toBe(true);
  });

  it("should avoid args-based temp pattern scanning", () => {
    const argsScanPattern = /argsStr\.includes\("temp_"\)|args\.find\(\(a\) => a\.includes\("temp_"\)\)/;
    const hasArgsScan = argsScanPattern.test(content);

    expect(
      hasArgsScan,
      "cleanup logic should not scan args for temp_ pattern anymore"
    ).toBe(false);
  });

  it("should cleanup temp file via tempFilePath with async unlink", () => {
    const cleanupPattern = /if \(tempFilePath\)[\s\S]*?fsPromises\.unlink\(tempFilePath\)/;
    const hasCleanup = cleanupPattern.test(content);

    expect(
      hasCleanup,
      "cleanup logic should use tempFilePath + fsPromises.unlink"
    ).toBe(true);
  });
});
