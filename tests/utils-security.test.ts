import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { readWsFile, resolveSafePath, safeCmd } from "../src/utils/utils.js";

describe("utils security", () => {
  it("should reject path traversal with base-prefix bypass", () => {
    const baseDir = path.join(os.tmpdir(), "safe-base");
    const bypassPath = "../safe-base-evil/secret.txt";

    expect(() => resolveSafePath(baseDir, bypassPath)).toThrow(
      /拒绝越权访问路径/,
    );
  });

  it("should reject protected paths", () => {
    const baseDir = path.join(os.tmpdir(), "safe-base");

    expect(() => resolveSafePath(baseDir, ".git/config")).toThrow(
      /拒绝访问受保护路径/,
    );
    expect(() => resolveSafePath(baseDir, ".env")).toThrow(
      /拒绝访问受保护路径/,
    );
  });

  it("should throw friendly message when file does not exist", () => {
    const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "ws-"));

    expect(() => readWsFile(workspaceDir, "missing.txt")).toThrow(
      /文件不存在: missing.txt/,
    );

    fs.rmSync(workspaceDir, { recursive: true, force: true });
  });

  it("should safely pass shell metacharacters as arguments in safeCmd without executing them", () => {
    // Using 'echo' since it's available on both Windows and Unix
    const result = safeCmd("echo", ["test", "&&", "ls"]);
    // The output should literally be the arguments, meaning '&& ls' is just printed, not executed
    expect(result.trim()).toContain("test && ls");
  });
});
