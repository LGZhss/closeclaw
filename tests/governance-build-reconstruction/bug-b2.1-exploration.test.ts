/**
 * Bug Condition Exploration Test for B2.1
 * 
 * **Validates: Requirements 2.1, 6.1**
 * 
 * **Property 1: Bug Condition** - cli_anything可执行任意命令
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code
 * Test that cli_anything tool exists in tool-definitions.ts
 * Test that cli_anything handler exists in tool-registry.ts
 * Test that src/tools/cli-anything.ts file exists
 * 
 * **NOTE**: cli_anything has already been removed in a previous fix.
 * This test confirms the tool is absent (which is the correct state).
 * 
 * Expected Outcome: Test PASSES (tool is absent, bug is already fixed)
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import { readFileSync } from "fs";

describe("Bug B2.1 Exploration: cli_anything Security Vulnerability", () => {
  const srcDir = join(process.cwd(), "src");
  const toolsDir = join(srcDir, "tools");

  it("should confirm cli_anything.ts file does NOT exist", () => {
    const cliAnythingPath = join(toolsDir, "cli-anything.ts");
    
    // This test expects the file to NOT exist (bug is fixed)
    expect(
      existsSync(cliAnythingPath),
      `cli_anything.ts should not exist (security vulnerability removed)`
    ).toBe(false);
  });

  it("should confirm cli_anything is NOT in tool-definitions.ts", () => {
    const toolDefsPath = join(toolsDir, "tool-definitions.ts");
    const content = readFileSync(toolDefsPath, "utf-8");
    
    // Check that cli_anything is not defined
    const hasCliAnything = /cli_anything/i.test(content);
    
    expect(
      hasCliAnything,
      `cli_anything should not be in tool-definitions.ts (security vulnerability removed)`
    ).toBe(false);
  });

  it("should confirm cli_anything handler is NOT in tool-registry.ts", () => {
    const toolRegistryPath = join(toolsDir, "tool-registry.ts");
    const content = readFileSync(toolRegistryPath, "utf-8");
    
    // Check that cli_anything handler is not defined
    const hasCliAnythingHandler = /cli_anything\s*:/i.test(content);
    
    expect(
      hasCliAnythingHandler,
      `cli_anything handler should not be in tool-registry.ts (security vulnerability removed)`
    ).toBe(false);
  });

  it("should confirm only safe tools are registered", async () => {
    // Import the tool definitions
    const { TOOL_DEFINITIONS } = await import("../../src/tools/tool-definitions.js");
    
    const toolNames = Object.keys(TOOL_DEFINITIONS);
    
    // Verify cli_anything is not in the list
    expect(toolNames).not.toContain("cli_anything");
    
    // Verify only expected safe tools are present
    const expectedTools = ["read_file", "write_file", "execute_code", "list_dir", "search_web"];
    
    for (const tool of toolNames) {
      expect(
        expectedTools.includes(tool),
        `Unexpected tool found: ${tool}. Only safe tools should be registered.`
      ).toBe(true);
    }
  });

  it("should confirm tool registry does not expose cli_anything", async () => {
    // Import the tool registry creator
    const { createToolRegistry } = await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");
    
    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, "/tmp/test");
    
    const toolNames = Object.keys(registry);
    
    // Verify cli_anything is not in the registry
    expect(toolNames).not.toContain("cli_anything");
    
    // Verify only expected safe tools are present
    expect(toolNames).toContain("read_file");
    expect(toolNames).toContain("write_file");
    expect(toolNames).toContain("execute_code");
    expect(toolNames).toContain("list_dir");
    expect(toolNames).toContain("search_web");
  });
});
