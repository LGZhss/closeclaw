import { describe, it, expect, vi } from "vitest";
import { readWsFile, writeWsFile } from "../src/utils/utils.js";
import fsPromises from "fs/promises";
import fs from "fs";

vi.mock("fs/promises");

describe("Utils File Operations", () => {
  describe("Path Traversal Checks", () => {
    it("should block reading protected files with traversal payloads", async () => {
      await expect(readWsFile("src/../.env")).rejects.toThrow("Access denied");
    });

    it("should block writing protected files with traversal payloads", async () => {
      const result = await writeWsFile("src/../.env", "test");
      expect(result).toContain("Access denied");
    });
  });
});
