import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanupTmpFiles } from "../src/utils/fs-cleanup.js";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
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

vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("os")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      tmpdir: vi.fn(),
    },
  };
});

describe("fs-cleanup", () => {
  const MOCK_TMP_DIR = "/mock/tmp";
  const ONE_HOUR_MS = 1000 * 60 * 60;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(os.tmpdir).mockReturnValue(MOCK_TMP_DIR);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should delete temp files older than 1 hour", async () => {
    const files = ["temp_1.ts", "temp_2.js", "not_temp.ts", "temp_3.txt"];
    vi.mocked(fsPromises.readdir).mockResolvedValue(files as any);

    const now = Date.now();
    vi.mocked(fsPromises.stat).mockImplementation(async (filePath) => {
      const name = path.basename(filePath as string);
      if (name === "temp_1.ts") {
        return { mtimeMs: now - ONE_HOUR_MS - 1000 } as any; // older
      } else if (name === "temp_2.js") {
        return { mtimeMs: now - 1000 } as any; // newer
      }
      return { mtimeMs: now } as any;
    });

    await cleanupTmpFiles();

    expect(fsPromises.readdir).toHaveBeenCalledWith(MOCK_TMP_DIR);

    const statFiles = ["temp_1.ts", "temp_2.js"];
    for (const statFile of statFiles) {
      expect(fsPromises.stat).toHaveBeenCalledWith(
        path.join(MOCK_TMP_DIR, statFile),
      );
    }

    const notStatFiles = ["not_temp.ts", "temp_3.txt"];
    for (const notStatFile of notStatFiles) {
      expect(fsPromises.stat).not.toHaveBeenCalledWith(
        path.join(MOCK_TMP_DIR, notStatFile),
      );
    }

    expect(fsPromises.unlink).toHaveBeenCalledTimes(1);
    expect(fsPromises.unlink).toHaveBeenCalledWith(
      path.join(MOCK_TMP_DIR, "temp_1.ts"),
    );
  });

  it("should not fail if stat throws an error for a single file", async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue([
      "temp_1.ts",
      "temp_2.ts",
    ] as any);

    vi.mocked(fsPromises.stat).mockImplementation(async (filePath) => {
      const name = path.basename(filePath as string);
      if (name === "temp_1.ts") {
        throw new Error("stat failed");
      }
      return { mtimeMs: Date.now() - ONE_HOUR_MS - 1000 } as any;
    });

    await expect(cleanupTmpFiles()).resolves.not.toThrow();

    expect(fsPromises.unlink).toHaveBeenCalledTimes(1);
    expect(fsPromises.unlink).toHaveBeenCalledWith(
      path.join(MOCK_TMP_DIR, "temp_2.ts"),
    );
  });

  it("should not fail if readdir throws an error", async () => {
    vi.mocked(fsPromises.readdir).mockRejectedValue(
      new Error("readdir failed"),
    );

    await expect(cleanupTmpFiles()).resolves.not.toThrow();
  });
});
