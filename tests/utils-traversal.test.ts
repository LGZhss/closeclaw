import { describe, it, expect } from "vitest";
import { readWsFile, writeWsFile } from "../src/utils/utils.js";

describe("utils - path traversal protection", () => {
  it("should block reading .env via path traversal", async () => {
    await expect(readWsFile("src/../.env")).rejects.toThrow(
      "Access denied: src/../.env is a protected path",
    );
  });

  it("should block writing .env via path traversal", async () => {
    const result = await writeWsFile("src/../.env", "test");
    expect(result).toBe("Access denied: src/../.env is a protected path");
  });
});
