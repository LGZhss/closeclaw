import { describe, it, expect, beforeEach, vi } from "vitest";
import { LLMAdapterRegistry, LLMAdapter } from "../../src/adapters/registry.js";
import { logger } from "../../src/logger.js";

// Mock logger to avoid cluttering test output and to verify log calls
vi.mock("../../src/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LLMAdapterRegistry", () => {
  let registry: LLMAdapterRegistry;

  const mockAdapter1: LLMAdapter = {
    name: "test-adapter-1",
    chat: vi.fn().mockResolvedValue({ message: "response 1" }),
  };

  const mockAdapter2: LLMAdapter = {
    name: "test-adapter-2",
    chat: vi.fn().mockResolvedValue({ message: "response 2" }),
  };

  beforeEach(() => {
    registry = new LLMAdapterRegistry();
    // Clear any default adapters if they are registered in constructor
    registry.clear();
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new adapter", () => {
      registry.register(mockAdapter1);
      expect(registry.has("test-adapter-1")).toBe(true);
      expect(registry.get("test-adapter-1")).toBe(mockAdapter1);
      expect(registry.size).toBe(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Registered adapter: test-adapter-1"),
      );
    });

    it("should overwrite an existing adapter and log a warning", () => {
      registry.register(mockAdapter1);
      const newMockAdapter1: LLMAdapter = {
        name: "test-adapter-1",
        chat: vi.fn(),
      };
      registry.register(newMockAdapter1);

      expect(registry.get("test-adapter-1")).toBe(newMockAdapter1);
      expect(registry.size).toBe(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Overwriting existing adapter: test-adapter-1"),
      );
    });
  });

  describe("get", () => {
    it("should return the registered adapter", () => {
      registry.register(mockAdapter1);
      const adapter = registry.get("test-adapter-1");
      expect(adapter).toBe(mockAdapter1);
    });

    it("should throw an error if adapter is not found", () => {
      expect(() => registry.get("non-existent")).toThrow(
        /LLM adapter not found: non-existent/,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Adapter not found: non-existent"),
      );
    });
  });

  describe("has", () => {
    it("should return true for registered adapter", () => {
      registry.register(mockAdapter1);
      expect(registry.has("test-adapter-1")).toBe(true);
    });

    it("should return false for non-registered adapter", () => {
      expect(registry.has("non-existent")).toBe(false);
    });
  });

  describe("list", () => {
    it("should return a list of registered adapter names", () => {
      registry.register(mockAdapter1);
      registry.register(mockAdapter2);
      const list = registry.list();
      expect(list).toContain("test-adapter-1");
      expect(list).toContain("test-adapter-2");
      expect(list.length).toBe(2);
    });

    it("should return an empty list when no adapters are registered", () => {
      expect(registry.list()).toEqual([]);
    });
  });

  describe("unregister", () => {
    it("should remove a registered adapter and return true", () => {
      registry.register(mockAdapter1);
      const result = registry.unregister("test-adapter-1");
      expect(result).toBe(true);
      expect(registry.has("test-adapter-1")).toBe(false);
      expect(registry.size).toBe(0);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Unregistered adapter: test-adapter-1"),
      );
    });

    it("should return false and log a warning if adapter to remove does not exist", () => {
      const result = registry.unregister("non-existent");
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Adapter not found for removal: non-existent"),
      );
    });
  });

  describe("clear", () => {
    it("should remove all registered adapters", () => {
      registry.register(mockAdapter1);
      registry.register(mockAdapter2);
      expect(registry.size).toBe(2);

      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.list()).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Cleared 2 adapters"),
      );
    });
  });

  describe("size", () => {
    it("should return the correct number of registered adapters", () => {
      expect(registry.size).toBe(0);
      registry.register(mockAdapter1);
      expect(registry.size).toBe(1);
      registry.register(mockAdapter2);
      expect(registry.size).toBe(2);
    });
  });
});
