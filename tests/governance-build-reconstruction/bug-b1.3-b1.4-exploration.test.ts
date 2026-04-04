/**
 * Bug Condition Exploration Test for B1.3-B1.4
 *
 * **Validates: Requirements 1.3, 1.4, 5.3, 5.4**
 *
 * **Property 1: Bug Condition** - 未使用变量和隐式any类型
 *
 * Test that src/index.ts has no unused imports (config)
 * Test that src/index.ts busClient.onMessage callback has explicit type for msg parameter
 *
 * Expected Outcome on UNFIXED code: Test FAILS with TS6133 and TS7006 errors
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Bug B1.3-B1.4 Exploration: TypeScript Type Errors", () => {
  const indexPath = join(process.cwd(), "src", "index.ts");
  const indexContent = readFileSync(indexPath, "utf-8");

  it("should confirm config import is used or removed (Bug B1.3)", () => {
    // Check if config is imported
    const hasConfigImport =
      /import\s+\{[^}]*config[^}]*\}\s+from\s+["']\.\/config\.js["']/.test(
        indexContent,
      );

    if (hasConfigImport) {
      // If imported, it should be used in the code
      const configUsagePattern = /\bconfig\b/g;
      const matches = indexContent.match(configUsagePattern) || [];

      // Should have at least 2 matches: 1 for import, 1+ for usage
      expect(
        matches.length,
        `Bug B1.3 confirmed: config is imported but only appears ${matches.length} time(s). ` +
          `Expected at least 2 (import + usage). This causes TS6133: 'config' is declared but its value is never read.`,
      ).toBeGreaterThan(1);
    }

    // If this test fails, it confirms the bug exists
  });

  it("should confirm busClient.onMessage callback has explicit type for msg parameter (Bug B1.4)", () => {
    // Look for the onMessage callback
    const onMessagePattern =
      /busClient\.onMessage\s*\(\s*async\s*\(\s*(\w+)\s*(?::\s*(\w+))?\s*\)/;
    const match = indexContent.match(onMessagePattern);

    expect(match).toBeTruthy();

    if (match) {
      const paramName = match[1]; // e.g., "msg"
      const paramType = match[2]; // e.g., "BusMessage" or undefined

      expect(
        paramType,
        `Bug B1.4 confirmed: Parameter '${paramName}' in busClient.onMessage callback has no explicit type. ` +
          `This causes TS7006: Parameter '${paramName}' implicitly has an 'any' type. ` +
          `Expected explicit type like 'BusMessage'.`,
      ).toBeDefined();
    }
  });

  it("should confirm BusMessage type is imported if msg parameter needs typing", () => {
    // If msg parameter needs typing, BusMessage should be imported
    const hasBusMessageImport = /import\s+\{[^}]*BusMessage[^}]*\}\s+from/.test(
      indexContent,
    );
    const hasOnMessage = /busClient\.onMessage/.test(indexContent);

    if (hasOnMessage) {
      expect(
        hasBusMessageImport,
        `Bug B1.4 related: BusMessage type is not imported, but busClient.onMessage callback needs it for type safety.`,
      ).toBe(true);
    }
  });
});
