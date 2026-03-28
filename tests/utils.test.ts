import { describe, it, expect, vi } from "vitest";
import { parseCommandString, execAsync } from "../src/utils/utils.js";

describe("Utils module", () => {
  describe("parseCommandString", () => {
    it("should parse basic commands correctly", () => {
      expect(parseCommandString("git status")).toEqual(["git", "status"]);
      expect(parseCommandString("  git    commit  ")).toEqual([
        "git",
        "commit",
      ]);
    });

    it("should handle single quotes", () => {
      expect(parseCommandString("echo 'hello world'")).toEqual([
        "echo",
        "hello world",
      ]);
      expect(parseCommandString("commit -m 'initial commit'")).toEqual([
        "commit",
        "-m",
        "initial commit",
      ]);
    });

    it("should handle double quotes", () => {
      expect(parseCommandString('echo "hello world"')).toEqual([
        "echo",
        "hello world",
      ]);
      expect(parseCommandString('commit -m "initial commit"')).toEqual([
        "commit",
        "-m",
        "initial commit",
      ]);
    });

    it("should handle empty quotes", () => {
      expect(parseCommandString('commit -m ""')).toEqual(["commit", "-m", ""]);
      expect(parseCommandString("commit -m ''")).toEqual(["commit", "-m", ""]);
    });

    it("should handle escaped characters inside quotes", () => {
      expect(parseCommandString('echo "hello \\" world"')).toEqual([
        "echo",
        'hello " world',
      ]);
      expect(parseCommandString("echo 'hello \\' world'")).toEqual([
        "echo",
        "hello ' world",
      ]);
    });

    it("should return empty array for empty string", () => {
      expect(parseCommandString("")).toEqual([]);
      expect(parseCommandString("   ")).toEqual([]);
    });
  });

  describe("execAsync", () => {
    it("should reject with empty command", async () => {
      await expect(execAsync("")).rejects.toThrow("Empty command");
    });

    it("should execute simple commands", async () => {
      const result = await execAsync('echo "hello world"');
      expect(result.stdout).toContain("hello world");
    });
  });
});
