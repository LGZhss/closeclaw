import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import { cleanupTmpFiles } from "../src/utils/fs-cleanup.js";
import { logger } from "../src/logger.js";

vi.mock("fs/promises", () => ({
  default: {
    readdir: vi.fn(),
    stat: vi.fn(),
    unlink: vi.fn(),
  },
}));

vi.mock("../src/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("fs-cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should do nothing if no temp files exist", async () => {
    (fsPromises.readdir as any).mockResolvedValue(["other_file.txt"]);
    await cleanupTmpFiles();
    expect(fsPromises.stat).not.toHaveBeenCalled();
    expect(fsPromises.unlink).not.toHaveBeenCalled();
  });

  it("should delete old temp files", async () => {
    const oldTime = Date.now() - 2 * 60 * 60 * 1000;
    (fsPromises.readdir as any).mockResolvedValue(["temp_123.js"]);
    (fsPromises.stat as any).mockResolvedValue({ mtimeMs: oldTime });
    await cleanupTmpFiles();
    expect(fsPromises.unlink).toHaveBeenCalledWith(
      path.join(os.tmpdir(), "temp_123.js"),
    );
  });

  it("should not delete new temp files", async () => {
    const newTime = Date.now() - 1000;
    (fsPromises.readdir as any).mockResolvedValue(["temp_123.js"]);
    (fsPromises.stat as any).mockResolvedValue({ mtimeMs: newTime });
    await cleanupTmpFiles();
    expect(fsPromises.unlink).not.toHaveBeenCalled();
  });
});
