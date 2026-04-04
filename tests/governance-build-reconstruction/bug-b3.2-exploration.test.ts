/**
 * Bug Condition Exploration Test for B3.2
 *
 * **Validates: Requirements 3.2, 7.2**
 *
 * **Property 1: Bug Condition** - read_file无法处理带空格的文件名
 *
 * This test verifies that _parseArgsToObject (if it exists) has special handling
 * for write_file but NOT for read_file. This is the bug condition.
 *
 * **NOTE**: The current codebase doesn't have _parseArgsToObject method, which means
 * the bug manifests differently - there's no special argument parsing at all.
 *
 * Expected Outcome: Test PASSES (confirms no special handling for read_file exists)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("Bug B3.2 Exploration: read_file Parameter Parsing", () => {
  const testWorkspace = join(tmpdir(), `test-workspace-b3.2-${Date.now()}`);
  const toolRegistryPath = join(
    process.cwd(),
    "src",
    "tools",
    "tool-registry.ts",
  );

  beforeAll(() => {
    // Create test workspace
    if (!existsSync(testWorkspace)) {
      mkdirSync(testWorkspace, { recursive: true });
    }

    // Create test file with spaces in name
    writeFileSync(
      join(testWorkspace, "file with spaces.txt"),
      "Content with spaces",
      "utf-8",
    );

    // Create test file without spaces
    writeFileSync(
      join(testWorkspace, "file-no-spaces.txt"),
      "Content without spaces",
      "utf-8",
    );
  });

  it("should confirm _parseArgsToObject method does NOT exist in tool-registry.ts", () => {
    const content = readFileSync(toolRegistryPath, "utf-8");

    // Verify _parseArgsToObject doesn't exist
    const hasParseMethod = /_parseArgsToObject/.test(content);

    expect(
      hasParseMethod,
      "Bug B3.2 confirmed: _parseArgsToObject method does not exist in current implementation. " +
        "This means there's no special argument parsing for commands like '/read file with spaces.txt'",
    ).toBe(false);
  });

  it("should confirm write_file handler does NOT have special argument parsing", () => {
    const content = readFileSync(toolRegistryPath, "utf-8");

    // Check if write_file has any special parsing logic
    // In the bug scenario, write_file SHOULD have special handling but read_file should NOT
    const writeFileMatch = content.match(
      /write_file:\s*async\s*\([^)]+\)\s*=>\s*\{[^}]+\}/s,
    );

    expect(writeFileMatch).toBeTruthy();

    if (writeFileMatch) {
      const writeFileBody = writeFileMatch[0];

      // Verify it uses simple destructuring (no special parsing)
      const hasDestructuring = /\{\s*path:\s*filePath,\s*content\s*\}/.test(
        writeFileBody,
      );

      expect(
        hasDestructuring,
        "write_file currently uses simple destructuring (no special parsing for spaces)",
      ).toBe(true);
    }
  });

  it("should confirm read_file handler does NOT have special argument parsing", () => {
    const content = readFileSync(toolRegistryPath, "utf-8");

    // Check if read_file has any special parsing logic
    const readFileMatch = content.match(
      /read_file:\s*async\s*\([^)]+\)\s*=>\s*\{[^}]+\}/s,
    );

    expect(readFileMatch).toBeTruthy();

    if (readFileMatch) {
      const readFileBody = readFileMatch[0];

      // Verify it uses simple destructuring (no special parsing)
      const hasDestructuring = /\{\s*path:\s*filePath\s*\}/.test(readFileBody);

      expect(
        hasDestructuring,
        "Bug B3.2 confirmed: read_file uses simple destructuring with no special handling for spaces. " +
          "This is the expected bug condition - read_file lacks special argument parsing.",
      ).toBe(true);
    }
  });

  it("should confirm neither write_file nor read_file have special regex-based parsing", () => {
    const content = readFileSync(toolRegistryPath, "utf-8");

    // The bug is that there's no _parseArgsToObject method with special handling
    // The fix (in task 18) will add regex patterns like /^\/write\s+(\S+)\s+([\s\S]*)$/i
    // Currently, this should NOT exist

    const hasWriteRegex = /\/write\\s\+/.test(content);
    const hasReadRegex = /\/read\\s\+/.test(content);

    expect(
      hasWriteRegex,
      "Bug B3.2 confirmed: write_file does not have special regex parsing (will be added in fix)",
    ).toBe(false);

    expect(
      hasReadRegex,
      "Bug B3.2 confirmed: read_file does not have special regex parsing (will be added in fix)",
    ).toBe(false);
  });

  it("should verify current implementation can handle files without spaces", async () => {
    const { createToolRegistry } =
      await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");

    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);

    const result = await registry.read_file({ path: "file-no-spaces.txt" }, {});

    expect(result.content).toContain("Content without spaces");
  });

  it("should verify current implementation CAN handle files with spaces (when passed as object)", async () => {
    const { createToolRegistry } =
      await import("../../src/tools/tool-registry.js");
    const { SandboxManager } = await import("../../src/sandbox/manager.js");

    const sandboxManager = new SandboxManager();
    const registry = createToolRegistry(sandboxManager, testWorkspace);

    // When arguments are passed as an object (current implementation), spaces work fine
    // The bug is about parsing command-line style input like "/read file with spaces.txt"
    const result = await registry.read_file(
      { path: "file with spaces.txt" },
      {},
    );

    expect(result.content).toContain("Content with spaces");
  });

  it("should document the bug: no command-line style argument parsing exists", () => {
    const content = readFileSync(toolRegistryPath, "utf-8");

    // The bug is that if users send commands like "/read file with spaces.txt" via Telegram,
    // there's no _parseArgsToObject method to parse this into { path: "file with spaces.txt" }
    // The current implementation expects arguments to already be in object form

    const hasParseMethod = /_parseArgsToObject/.test(content);
    const hasCommandParsing = /\/read|\/write/.test(content);

    expect(
      hasParseMethod || hasCommandParsing,
      "Bug B3.2 confirmed: No command-line style argument parsing exists. " +
        "Users cannot send '/read file with spaces.txt' - the system expects pre-parsed objects. " +
        "The fix will add _parseArgsToObject method with regex-based parsing.",
    ).toBe(false);
  });
});
