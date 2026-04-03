/**
 * Preservation Property Test for B3.2
 * 
 * **Validates: Requirements 9.5**
 * 
 * **Property 2: Preservation** - write_file和其他工具继续正常工作
 * 
 * This test verifies that write_file with spaces in filename continues to work,
 * and that other tools' argument parsing continues to work correctly.
 * 
 * These tests run on UNFIXED code to establish baseline behavior that must be preserved.
 * 
 * Expected Outcome: Tests PASS (confirms baseline behavior to preserve)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("Bug B3.2 Preservation: write_file and Other Tools Continue Working", () => {
  const testWorkspace = join(tmpdir(), `test-workspace-b3.2-preservation-${Date.now()}`);
  
  beforeAll(() => {
    // Create test workspace
    if (!existsSync(testWorkspace)) {
      mkdirSync(testWorkspace, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test workspace
    if (existsSync(testWorkspace)) {
      rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  it("should preserve write_file functionality with spaces in filename", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Test write_file with spaces in filename (passed as object)
    const result = await registry.write_file(
      { 
        path: "test file with spaces.txt", 
        content: "This is test content with spaces in filename" 
      }, 
      {}
    );
    
    expect(result.success).toBe(true);
    
    // Verify file was actually written
    const filePath = join(testWorkspace, "test file with spaces.txt");
    expect(existsSync(filePath)).toBe(true);
    
    const content = readFileSync(filePath, "utf-8");
    expect(content).toBe("This is test content with spaces in filename");
  });

  it("should preserve write_file functionality without spaces in filename", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Test write_file without spaces in filename
    const result = await registry.write_file(
      { 
        path: "test-file-no-spaces.txt", 
        content: "This is test content without spaces" 
      }, 
      {}
    );
    
    expect(result.success).toBe(true);
    
    // Verify file was actually written
    const filePath = join(testWorkspace, "test-file-no-spaces.txt");
    expect(existsSync(filePath)).toBe(true);
    
    const content = readFileSync(filePath, "utf-8");
    expect(content).toBe("This is test content without spaces");
  });

  it("should preserve read_file functionality with object arguments", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Create test file first
    const testFile = join(testWorkspace, "read-test.txt");
    writeFileSync(testFile, "Content for read test", "utf-8");
    
    // Test read_file with object arguments
    const result = await registry.read_file({ path: "read-test.txt" }, {});
    
    expect(result.content).toBe("Content for read test");
  });

  it("should preserve execute_code functionality", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Test execute_code with simple JavaScript
    const result = await registry.execute_code(
      { code: "console.log('Hello from execute_code'); 2 + 2;" },
      { traceId: "test-trace-b3.2-preservation" }
    );
    
    expect(result).toBeDefined();
    // execute_code should return some result (exact format may vary)
  });

  it("should preserve list_dir functionality", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Test list_dir
    const result = await registry.list_dir({ path: testWorkspace }, {});
    
    expect(result).toBeDefined();
    expect(result.files).toBeDefined();
    expect(Array.isArray(result.files)).toBe(true);
  });

  it("should preserve search_web functionality", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Test search_web (mock implementation)
    const result = await registry.search_web({ query: "test query" }, {});
    
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.results).toContain("Searching for: test query");
  });

  it("should preserve tool registry structure and all tool handlers", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Verify all expected tools exist
    expect(registry.read_file).toBeDefined();
    expect(registry.write_file).toBeDefined();
    expect(registry.execute_code).toBeDefined();
    expect(registry.list_dir).toBeDefined();
    expect(registry.search_web).toBeDefined();
    
    // Verify they are all functions
    expect(typeof registry.read_file).toBe("function");
    expect(typeof registry.write_file).toBe("function");
    expect(typeof registry.execute_code).toBe("function");
    expect(typeof registry.list_dir).toBe("function");
    expect(typeof registry.search_web).toBe("function");
  });

  it("should preserve write_file with multiline content", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    const multilineContent = `Line 1
Line 2
Line 3
Line 4 with special chars: !@#$%^&*()`;
    
    // Test write_file with multiline content
    const result = await registry.write_file(
      { 
        path: "multiline-test.txt", 
        content: multilineContent 
      }, 
      {}
    );
    
    expect(result.success).toBe(true);
    
    // Verify content was preserved exactly
    const filePath = join(testWorkspace, "multiline-test.txt");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toBe(multilineContent);
  });

  it("should preserve write_file with special characters in content", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    const specialContent = "Content with 'quotes', \"double quotes\", and `backticks`";
    
    // Test write_file with special characters
    const result = await registry.write_file(
      { 
        path: "special-chars.txt", 
        content: specialContent 
      }, 
      {}
    );
    
    expect(result.success).toBe(true);
    
    // Verify content was preserved exactly
    const filePath = join(testWorkspace, "special-chars.txt");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toBe(specialContent);
  });

  it("should preserve argument passing structure for all tools", async () => {
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);
    
    // Verify that tools accept arguments as objects (current implementation)
    // This is the baseline behavior that must be preserved after the fix
    
    // write_file accepts { path, content }
    const writeResult = await registry.write_file(
      { path: "arg-test.txt", content: "test" },
      {}
    );
    expect(writeResult.success).toBe(true);
    
    // read_file accepts { path }
    const readResult = await registry.read_file(
      { path: "arg-test.txt" },
      {}
    );
    expect(readResult.content).toBe("test");
    
    // execute_code accepts { code }
    const execResult = await registry.execute_code(
      { code: "1 + 1" },
      { traceId: "test-trace" }
    );
    expect(execResult).toBeDefined();
    
    // list_dir accepts { path }
    const listResult = await registry.list_dir(
      { path: testWorkspace },
      {}
    );
    expect(listResult.files).toBeDefined();
    
    // search_web accepts { query }
    const searchResult = await registry.search_web(
      { query: "test" },
      {}
    );
    expect(searchResult.results).toBeDefined();
  });
});
