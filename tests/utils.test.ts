import { describe, it, expect } from "vitest";
import { isProtectedPath } from "../src/utils/utils.js";

describe("isProtectedPath", () => {
  const testCases = [
    { path: "package.json", expected: true },
    { path: "./package.json", expected: true },
    { path: "foo/../package.json", expected: true },
    { path: "src/../.env", expected: true },
    { path: "src/../node_modules/foo/bar", expected: true },
    { path: ".git/config", expected: true },
    { path: "src/utils/utils.ts", expected: false },
    { path: "foo/bar.txt", expected: false },
  ];

  testCases.forEach(({ path, expected }) => {
    it(`should return ${expected} for ${path}`, () => {
      expect(isProtectedPath(path)).toBe(expected);
    });
  });
});
