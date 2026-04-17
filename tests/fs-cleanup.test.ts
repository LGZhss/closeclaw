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
    }
  };
});

vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("os")>();
  return {
    ...actual,
    default: {
        ...actual.default,
        tmpdir: vi.fn()
    }
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

  const MOCK_T1 = "temp_1.ts";
  const MOCK_T2 = "temp_2.ts";

  const runTestScenario = async (
    files: string[],
    statMock: (name: string) => any,
    expectedUnlink: string,
    expectThrow = false
  ) => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(files as any);
    vi.mocked(fsPromises.stat).mockImplementation(async (filePath) => statMock(path.basename(filePath as string)));

    const promise = cleanupTmpFiles();
    if (expectThrow) {
      await expect(promise).rejects.toThrow();
    } else {
      await expect(promise).resolves.not.toThrow();
      expect(fsPromises.unlink).toHaveBeenCalledTimes(1);
      expect(fsPromises.unlink).toHaveBeenCalledWith(path.join(MOCK_TMP_DIR, expectedUnlink));
    }
  };

  it("should delete temp files older than 1 hour", async () => {
    const now = Date.now();
    await runTestScenario(
      [MOCK_T1, "temp_2.js", "not_temp.ts", "temp_3.txt"],
      (name) => ({ mtimeMs: name === MOCK_T1 ? now - ONE_HOUR_MS - 1000 : now - 1000 }),
      MOCK_T1
    );
    expect(fsPromises.readdir).toHaveBeenCalledWith(MOCK_TMP_DIR);
    expect(fsPromises.stat).toHaveBeenCalledTimes(2);
  });

  it("should not fail if stat throws an error for a single file", async () => {
    await runTestScenario(
      [MOCK_T1, MOCK_T2],
      (name) => {
        if (name === MOCK_T1) throw new Error("stat failed");
        return { mtimeMs: Date.now() - ONE_HOUR_MS - 1000 };
      },
      MOCK_T2
    );
  });

  it("should not fail if readdir throws an error", async () => {
    vi.mocked(fsPromises.readdir).mockRejectedValue(new Error("readdir failed"));
    await expect(cleanupTmpFiles()).resolves.not.toThrow();
  });
});
