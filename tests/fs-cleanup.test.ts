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

  const MOCK_T1 = "temp_1.ts";
  const MOCK_T2 = "temp_2.ts";

  it.each([
    {
      desc: "deletes old files",
      files: [MOCK_T1, "temp_2.js", "not_temp.ts"],
      setup: () =>
        vi.mocked(fsPromises.stat).mockResolvedValue({
          mtimeMs: Date.now() - ONE_HOUR_MS - 1000,
        } as any),
      expected: MOCK_T1,
    },
    {
      desc: "ignores stat errors",
      files: [MOCK_T1, MOCK_T2],
      setup: () =>
        vi.mocked(fsPromises.stat).mockImplementation(async (p) => {
          if (path.basename(p as string) === MOCK_T1) throw new Error("err");
          return { mtimeMs: Date.now() - ONE_HOUR_MS - 1000 } as any;
        }),
      expected: MOCK_T2,
    },
  ])("should handle scenario: $desc", async ({ files, setup, expected }) => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(files as any);
    setup();
    await expect(cleanupTmpFiles()).resolves.not.toThrow();
    expect(fsPromises.unlink).toHaveBeenCalledWith(
      path.join(MOCK_TMP_DIR, expected),
    );
  });

  it("should handle readdir error", async () => {
    vi.mocked(fsPromises.readdir).mockRejectedValue(new Error("err"));
    await expect(cleanupTmpFiles()).resolves.not.toThrow();
  });
});
