import { describe, it, expect } from "vitest";
import { resolveSafePath } from "../src/utils/utils.js";

describe("resolveSafePath Security Enhancements", () => {
  it("should prevent partial directory prefix matching path traversal", () => {
    const baseDir = "/tmp/workspace";
    const bypassPath = "../workspace-secrets/foo";

    expect(() => resolveSafePath(baseDir, bypassPath)).toThrowError(
      /\[Security\] 拒绝越权访问路径/,
    );
  });
});
