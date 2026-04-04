/**
 * Preservation Property Tests for B2.2
 * 
 * **Validates: Requirements 9.6**
 * 
 * **Property 2: Preservation** - 读取正常文件继续工作
 * 
 * Test that readWsFile("README.md") continues to work
 * Test that readWsFile("src/index.ts") continues to work
 * 
 * Expected Outcome on UNFIXED code: Tests PASS
 */

import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("Bug B2.2 Preservation: Reading Normal Files Continues Working", () => {
  // Create a temporary workspace for testing
  const testWorkspace = join(tmpdir(), `test-workspace-preserve-${Date.now()}`);
  
  beforeAll(() => {
    // Create test workspace
    if (!existsSync(testWorkspace)) {
      mkdirSync(testWorkspace, { recursive: true });
    }
    
    // Create test README.md
    writeFileSync(join(testWorkspace, "README.md"), "# Test Project\n\nThis is a test.", "utf-8");
    
    // Create src directory
    const srcDir = join(testWorkspace, "src");
    if (!existsSync(srcDir)) {
      mkdirSync(srcDir, { recursive: true });
    }
    
    // Create test src/index.ts
    writeFileSync(join(srcDir, "index.ts"), "console.log('Hello World');", "utf-8");
    
    // Create test docs directory
    const docsDir = join(testWorkspace, "docs");
    if (!existsSync(docsDir)) {
      mkdirSync(docsDir, { recursive: true });
    }
    
    // Create test docs/guide.md
    writeFileSync(join(docsDir, "guide.md"), "# Guide\n\nUser guide content.", "utf-8");
  });

  it("should successfully read README.md", async () => {
    const { readWsFile } = await import("../../src/utils/utils.js");
    
    const content = readWsFile(testWorkspace, "README.md");
    
    expect(content).toContain("# Test Project");
    expect(content).toContain("This is a test");
  });

  it("should successfully read src/index.ts", async () => {
    const { readWsFile } = await import("../../src/utils/utils.js");
    
    const content = readWsFile(testWorkspace, "src/index.ts");
    
    expect(content).toContain("console.log");
    expect(content).toContain("Hello World");
  });

  it("should successfully read docs/guide.md", async () => {
    const { readWsFile } = await import("../../src/utils/utils.js");
    
    const content = readWsFile(testWorkspace, "docs/guide.md");
    
    expect(content).toContain("# Guide");
    expect(content).toContain("User guide content");
  });

  it("should successfully read files with various extensions", async () => {
    const { readWsFile } = await import("../../src/utils/utils.js");
    
    // Create test files
    writeFileSync(join(testWorkspace, "package.json"), '{"name": "test"}', "utf-8");
    writeFileSync(join(testWorkspace, "tsconfig.json"), '{"compilerOptions": {}}', "utf-8");
    writeFileSync(join(testWorkspace, "script.sh"), '#!/bin/bash\necho "test"', "utf-8");
    
    // Read them
    const pkg = readWsFile(testWorkspace, "package.json");
    const tsconfig = readWsFile(testWorkspace, "tsconfig.json");
    const script = readWsFile(testWorkspace, "script.sh");
    
    expect(pkg).toContain('"name": "test"');
    expect(tsconfig).toContain('"compilerOptions"');
    expect(script).toContain('echo "test"');
  });

  it("should preserve error handling for non-existent files", async () => {
    const { readWsFile } = await import("../../src/utils/utils.js");
    
    expect(() => {
      readWsFile(testWorkspace, "non-existent-file.txt");
    }).toThrow(/文件不存在/);
  });

  it("should preserve path traversal protection", async () => {
    const { readWsFile } = await import("../../src/utils/utils.js");
    
    expect(() => {
      readWsFile(testWorkspace, "../../../etc/passwd");
    }).toThrow(/Security.*越权访问/);
  });
});
