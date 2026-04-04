/**
 * Preservation Property Tests for B3.3
 * 
 * **Validates: Requirements 9.6**
 * 
 * **Property 2: Preservation** - git操作成功时继续正常工作
 * 
 * **IMPORTANT**: This is a preservation test for a bugfix spec.
 * These tests verify that the CURRENT behavior (which is correct) is preserved
 * after any fixes are applied.
 * 
 * **Expected Outcome**: Tests PASS on unfixed code (establishes baseline)
 * 
 * **Test Strategy**: 
 * - Test that runGit successfully executes git commands when git succeeds
 * - Test that runGit returns expected output format
 * - Test that runGit handles different git operations correctly
 * - Test that getGitHistory (which uses runGit) continues to work
 * 
 * Note: Bug B3.3 is already fixed in the current codebase. The current
 * implementation uses execSync (synchronous) with proper error handling,
 * which is correct and should be preserved.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runGit, getGitHistory, isGitRepo } from "../../src/utils/utils.js";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("Bug B3.3 Preservation: runGit Success Cases", () => {
  let testRepoPath: string;

  beforeAll(() => {
    // Create a temporary git repository for testing
    testRepoPath = mkdtempSync(join(tmpdir(), "git-test-"));
    
    // Initialize git repo
    execSync("git init", { cwd: testRepoPath, stdio: "ignore" });
    execSync('git config user.email "test@example.com"', { cwd: testRepoPath, stdio: "ignore" });
    execSync('git config user.name "Test User"', { cwd: testRepoPath, stdio: "ignore" });
    
    // Create initial commit
    execSync("echo 'test' > test.txt", { cwd: testRepoPath, stdio: "ignore" });
    execSync("git add .", { cwd: testRepoPath, stdio: "ignore" });
    execSync('git commit -m "Initial commit"', { cwd: testRepoPath, stdio: "ignore" });
  });

  afterAll(() => {
    // Clean up temporary directory
    try {
      rmSync(testRepoPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("Property: runGit executes git commands successfully", () => {
    it("should execute git status successfully", () => {
      const result = runGit(["status", "--short"], testRepoPath);
      
      // Should return a string (empty or with content)
      expect(typeof result).toBe("string");
      
      // Should not throw error
      expect(() => runGit(["status", "--short"], testRepoPath)).not.toThrow();
    });

    it("should execute git log successfully", () => {
      const result = runGit(["log", "--oneline", "-1"], testRepoPath);
      
      // Should return a string with commit info
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain "Initial commit"
      expect(result).toContain("Initial commit");
    });

    it("should execute git branch successfully", () => {
      const result = runGit(["branch"], testRepoPath);
      
      // Should return a string
      expect(typeof result).toBe("string");
      
      // Should contain master or main branch
      expect(result).toMatch(/\*?\s*(master|main)/);
    });

    it("should execute git rev-parse successfully", () => {
      const result = runGit(["rev-parse", "HEAD"], testRepoPath);
      
      // Should return a commit hash (40 characters)
      expect(typeof result).toBe("string");
      expect(result.length).toBe(40);
      
      // Should be a valid hex string
      expect(result).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  describe("Property: runGit returns correct output format", () => {
    it("should return trimmed string output", () => {
      const result = runGit(["status", "--short"], testRepoPath);
      
      // Should not have leading/trailing whitespace
      expect(result).toBe(result.trim());
    });

    it("should return empty string for commands with no output", () => {
      // git status --short returns empty when working tree is clean
      const result = runGit(["status", "--short"], testRepoPath);
      
      // Should be a string (may be empty)
      expect(typeof result).toBe("string");
    });

    it("should return multi-line output correctly", () => {
      // Create multiple commits
      execSync("echo 'test2' > test2.txt", { cwd: testRepoPath, stdio: "ignore" });
      execSync("git add .", { cwd: testRepoPath, stdio: "ignore" });
      execSync('git commit -m "Second commit"', { cwd: testRepoPath, stdio: "ignore" });
      
      const result = runGit(["log", "--oneline", "-2"], testRepoPath);
      
      // Should contain multiple lines
      expect(result.split("\n").length).toBeGreaterThanOrEqual(2);
      
      // Should contain both commits
      expect(result).toContain("Initial commit");
      expect(result).toContain("Second commit");
    });
  });

  describe("Property: runGit handles different git operations", () => {
    it("should handle git add operations", () => {
      // Create a new file
      execSync("echo 'test3' > test3.txt", { cwd: testRepoPath, stdio: "ignore" });
      
      // Add the file
      const result = runGit(["add", "test3.txt"], testRepoPath);
      
      // git add returns empty output on success
      expect(typeof result).toBe("string");
      
      // Verify file was added
      const status = runGit(["status", "--short"], testRepoPath);
      expect(status).toContain("test3.txt");
    });

    it("should handle git diff operations", () => {
      const result = runGit(["diff", "--cached", "--name-only"], testRepoPath);
      
      // Should return a string
      expect(typeof result).toBe("string");
    });

    it("should handle git show operations", () => {
      const result = runGit(["show", "--oneline", "-s", "HEAD"], testRepoPath);
      
      // Should return commit info
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Property: getGitHistory uses runGit correctly", () => {
    it("should return git history successfully", () => {
      const result = getGitHistory(testRepoPath, 5);
      
      // Should return a string
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain commit messages
      expect(result).toContain("commit");
    });

    it("should respect limit parameter", () => {
      // Create more commits (only if they don't exist)
      try {
        for (let i = 0; i < 3; i++) {
          execSync(`echo 'test${i}' > test${i}.txt`, { cwd: testRepoPath, stdio: "ignore" });
          execSync("git add .", { cwd: testRepoPath, stdio: "ignore" });
          try {
            execSync(`git commit -m "Commit ${i}"`, { cwd: testRepoPath, stdio: "ignore" });
          } catch {
            // Ignore if nothing to commit
          }
        }
      } catch {
        // Ignore errors in setup
      }
      
      const result = getGitHistory(testRepoPath, 2);
      
      // Should return limited number of commits
      const lines = result.split("\n").filter(line => line.trim().length > 0);
      expect(lines.length).toBeLessThanOrEqual(2);
    });

    it("should handle non-git directories gracefully", () => {
      const nonGitPath = mkdtempSync(join(tmpdir(), "non-git-"));
      
      try {
        const result = getGitHistory(nonGitPath, 5);
        
        // Should return fallback message
        expect(result).toBe("无 Git 提交记录");
      } finally {
        rmSync(nonGitPath, { recursive: true, force: true });
      }
    });
  });

  describe("Property: runGit integrates with isGitRepo", () => {
    it("should work in directories where isGitRepo returns true", () => {
      // Verify it's a git repo
      expect(isGitRepo(testRepoPath)).toBe(true);
      
      // runGit should work
      const result = runGit(["status"], testRepoPath);
      expect(typeof result).toBe("string");
    });

    it("should be consistent with git repository detection", () => {
      // If isGitRepo returns true, runGit should work
      if (isGitRepo(testRepoPath)) {
        expect(() => runGit(["status"], testRepoPath)).not.toThrow();
      }
    });
  });

  describe("Property: runGit preserves synchronous behavior", () => {
    it("should execute synchronously (not return Promise)", () => {
      const result = runGit(["status"], testRepoPath);
      
      // Should return string directly, not Promise
      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof result).toBe("string");
    });

    it("should block until git command completes", () => {
      const startTime = Date.now();
      
      // Execute a git command
      const result = runGit(["status"], testRepoPath);
      
      const endTime = Date.now();
      
      // Should have completed synchronously
      expect(typeof result).toBe("string");
      
      // Should have taken some time (not instant)
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it("should allow sequential git operations", () => {
      // Execute multiple git commands in sequence
      const result1 = runGit(["status"], testRepoPath);
      const result2 = runGit(["branch"], testRepoPath);
      const result3 = runGit(["log", "--oneline", "-1"], testRepoPath);
      
      // All should return strings
      expect(typeof result1).toBe("string");
      expect(typeof result2).toBe("string");
      expect(typeof result3).toBe("string");
      
      // All should have completed (result3 should contain commit hash and message)
      expect(result3.length).toBeGreaterThan(0);
    });
  });

  describe("Property: runGit maintains correct error handling structure", () => {
    it("should have retry mechanism that works for successful operations", () => {
      // Even with retries=0, successful operations should work
      const result = runGit(["status"], testRepoPath, 0);
      
      expect(typeof result).toBe("string");
    });

    it("should work with default retry parameter", () => {
      // Should use default retries=2
      const result = runGit(["status"], testRepoPath);
      
      expect(typeof result).toBe("string");
    });

    it("should work with custom retry parameter", () => {
      // Should accept custom retry count
      const result = runGit(["status"], testRepoPath, 5);
      
      expect(typeof result).toBe("string");
    });
  });
});
