import { describe, it, expect, vi } from "vitest";
import { parseCommandString, execAsync } from "../src/utils/utils.js";

describe("Utils module", () => {
  describe("parseCommandString", () => {
    const testCases = [
      { input: "git status", expected: ["git", "status"] },
      { input: "  git    commit  ", expected: ["git", "commit"] },
      { input: "echo 'hello world'", expected: ["echo", "hello world"] },
      { input: "commit -m 'initial commit'", expected: ["commit", "-m", "initial commit"] },
      { input: 'echo "hello world"', expected: ["echo", "hello world"] },
      { input: 'commit -m "initial commit"', expected: ["commit", "-m", "initial commit"] },
      { input: 'commit -m ""', expected: ["commit", "-m", ""] },
      { input: "commit -m ''", expected: ["commit", "-m", ""] },
      { input: 'echo "hello \\" world"', expected: ["echo", 'hello " world'] },
      { input: "echo 'hello \\' world'", expected: ["echo", "hello ' world"] },
      { input: "", expected: [] },
      { input: "   ", expected: [] }
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should correctly parse input: ${input}`, () => {
        expect(parseCommandString(input)).toEqual(expected);
      });
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
