import { vi, describe, it, expect, beforeEach } from "vitest";
import { cleanupTmpFiles } from "../../src/utils/fs-cleanup.js";
import fsPromises from "fs/promises";
import os from "os";
import { logger } from "../../src/logger.js";
import path from "path";

vi.mock("fs/promises", async () => {
  const actual =
    await vi.importActual<typeof import("fs/promises")>("fs/promises");
  return {
    ...actual,
    default: {
      ...actual.default,
      readdir: vi.fn(),
      stat: vi.fn(),
      unlink: vi.fn(),
    },
  };
});

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return {
    ...actual,
    default: {
      ...actual.default,
      tmpdir: vi.fn(),
    },
  };
});

vi.mock("../../src/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("cleanupTmpFiles", () => {
  const mockTmpDir = "/mock/tmp";
  const ONE_HOUR = 1000 * 60 * 60;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.tmpdir).mockReturnValue(mockTmpDir);
  });

  it("should delete files older than 1 hour matching temp prefix and extension", async () => {
    const now = Date.now();
    const oldTime = now - ONE_HOUR - 1000;

    vi.mocked(fsPromises.readdir).mockResolvedValue([
      "temp_old.js",
      "temp_new.ts",
      "other.txt",
    ] as any);
    vi.mocked(fsPromises.stat).mockImplementation(async (filePath) => {
      if (typeof filePath === "string" && filePath.includes("temp_old.js")) {
        return { mtimeMs: oldTime } as any;
      }
      if (typeof filePath === "string" && filePath.includes("temp_new.ts")) {
        return { mtimeMs: now } as any;
      }
      return { mtimeMs: now } as any;
    });
    vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);

    await cleanupTmpFiles();

    expect(fsPromises.readdir).toHaveBeenCalledWith(mockTmpDir);
    expect(fsPromises.stat).toHaveBeenCalledWith(
      path.join(mockTmpDir, "temp_old.js"),
    );
    expect(fsPromises.stat).toHaveBeenCalledWith(
      path.join(mockTmpDir, "temp_new.ts"),
    );
    expect(fsPromises.unlink).toHaveBeenCalledWith(
      path.join(mockTmpDir, "temp_old.js"),
    );
    expect(fsPromises.unlink).not.toHaveBeenCalledWith(
      path.join(mockTmpDir, "temp_new.ts"),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      "[Cleanup] Deleted old temp file: temp_old.js",
    );
  });

  it("should log warning if readdir fails", async () => {
    const error = new Error("Readdir failed");
    vi.mocked(fsPromises.readdir).mockRejectedValue(error);

    await cleanupTmpFiles();

    expect(logger.warn).toHaveBeenCalledWith(
      `[Cleanup] Failed to read tmp directory: ${error.message}`,
    );
  });

  it("should ignore single file processing errors", async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(["temp_error.js"] as any);
    vi.mocked(fsPromises.stat).mockRejectedValue(new Error("Stat failed"));

    await expect(cleanupTmpFiles()).resolves.toBeUndefined();
    expect(fsPromises.unlink).not.toHaveBeenCalled();
  });
});
