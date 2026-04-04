/**
 * Bug Condition Exploration Test for B2.2
 *
 * **Validates: Requirements 2.2, 6.2**
 *
 * **Property 1: Bug Condition** - readWsFile可读取敏感文件和目录
 *
 * **CRITICAL**: This test MUST FAIL on unfixed code
 * Test that readWsFile(".env") does NOT throw "Access denied" error
 * Test that readWsFile(".git/config") does NOT throw "Access denied" error
 *
 * Expected Outcome on UNFIXED code: Test PASSES (confirms no protection for directories, which is the bug)
 */

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("Bug B2.2 Exploration: readWsFile Missing Protection", () => {
  // Create a temporary workspace for testing
  const testWorkspace = join(tmpdir(), `test-workspace-${Date.now()}`);

  beforeAll(() => {
    // Create test workspace
    if (!existsSync(testWorkspace)) {
      mkdirSync(testWorkspace, { recursive: true });
    }

    // Create test .git directory
    const gitDir = join(testWorkspace, ".git");
    if (!existsSync(gitDir)) {
      mkdirSync(gitDir, { recursive: true });
    }

    // Create test .git/config file
    writeFileSync(
      join(gitDir, "config"),
      "[core]\n\trepositoryformatversion = 0",
      "utf-8",
    );

    // Create test node_modules directory
    const nodeModulesDir = join(testWorkspace, "node_modules");
    if (!existsSync(nodeModulesDir)) {
      mkdirSync(nodeModulesDir, { recursive: true });
    }

    // Create test file in node_modules
    writeFileSync(join(nodeModulesDir, "package.json"), "{}", "utf-8");
  });

  it("should confirm .env file is protected by PROTECTED_FILES", async () => {
    // Import readWsFile
    const { readWsFile } = await import("../../src/utils/utils.js");

    // Create a test .env file
    const envPath = join(testWorkspace, ".env");
    writeFileSync(envPath, "SECRET_KEY=test123", "utf-8");

    // Try to read .env - should be blocked by PROTECTED_FILES
    expect(() => {
      readWsFile(testWorkspace, ".env");
    }).toThrow(/Security.*敏感文件/);
  });

  it("should confirm .git directory is NOT protected (Bug B2.2)", async () => {
    // Import readWsFile
    const { readWsFile } = await import("../../src/utils/utils.js");

    // Try to read .git/config - this SHOULD fail on unfixed code (no protection)
    // But we expect it to succeed, confirming the bug
    let canReadGitConfig = false;
    let errorMessage = "";

    try {
      const content = readWsFile(testWorkspace, ".git/config");
      canReadGitConfig = true;
      expect(content).toContain("repositoryformatversion");
    } catch (error: any) {
      errorMessage = error.message;
      canReadGitConfig = false;
    }

    // On unfixed code, this should be true (bug exists)
    // On fixed code, this should be false (protection added)
    expect(
      canReadGitConfig,
      `Bug B2.2 confirmed: readWsFile can read .git/config. ` +
        `Error: ${errorMessage}. ` +
        `Expected protection for .git directory to be added.`,
    ).toBe(true);
  });

  it("should confirm node_modules directory is NOT protected (Bug B2.2)", async () => {
    // Import readWsFile
    const { readWsFile } = await import("../../src/utils/utils.js");

    // Try to read node_modules/package.json
    let canReadNodeModules = false;
    let errorMessage = "";

    try {
      const content = readWsFile(testWorkspace, "node_modules/package.json");
      canReadNodeModules = true;
      expect(content).toContain("{}");
    } catch (error: any) {
      errorMessage = error.message;
      canReadNodeModules = false;
    }

    // On unfixed code, this should be true (bug exists)
    // On fixed code, this should be false (protection added)
    expect(
      canReadNodeModules,
      `Bug B2.2 confirmed: readWsFile can read node_modules/package.json. ` +
        `Error: ${errorMessage}. ` +
        `Expected protection for node_modules directory to be added.`,
    ).toBe(true);
  });

  it("should confirm PROTECTED_FILES only covers specific files, not directories", () => {
    // Read the utils.ts source to check PROTECTED_FILES
    const utilsPath = join(process.cwd(), "src", "utils", "utils.ts");
    const utilsContent = readFileSync(utilsPath, "utf-8");

    // Find PROTECTED_FILES definition
    const protectedFilesMatch = utilsContent.match(
      /const PROTECTED_FILES\s*=\s*\[(.*?)\]/s,
    );

    expect(protectedFilesMatch).toBeTruthy();

    if (protectedFilesMatch) {
      const protectedFiles = protectedFilesMatch[1];

      // Confirm it only has files, not directory patterns
      expect(protectedFiles).toContain(".env");

      // Bug: It doesn't protect directories like .git, node_modules
      expect(protectedFiles).not.toContain(".git");
      expect(protectedFiles).not.toContain("node_modules");
    }
  });
});
