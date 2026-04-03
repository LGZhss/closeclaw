/**
 * Bug Condition Exploration Test for B1.1-B1.2
 * 
 * **Validates: Requirements 1.1, 1.2, 5.1, 5.2**
 * 
 * **Property 1: Bug Condition** - 缺失 bus/grpc-client 和 adapters/registry 导致编译失败
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 * 
 * Expected Outcome on UNFIXED code: Test FAILS with TS2307: Cannot find module errors
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

describe("Bug B1.1-B1.2 Exploration: Missing Core Modules", () => {
  const srcDir = join(process.cwd(), "src");

  it("should confirm src/bus/grpc-client.ts exists (Bug B1.1)", () => {
    const grpcClientPath = join(srcDir, "bus", "grpc-client.ts");
    
    // This test EXPECTS to FAIL on unfixed code
    // Failure confirms the bug: module is missing
    expect(
      existsSync(grpcClientPath),
      `Bug B1.1 confirmed: src/bus/grpc-client.ts does not exist. ` +
      `This causes TS2307: Cannot find module './bus/grpc-client.js' in src/index.ts`
    ).toBe(true);
  });

  it("should confirm src/adapters/registry.ts exists (Bug B1.2)", () => {
    const registryPath = join(srcDir, "adapters", "registry.ts");
    
    // This test EXPECTS to FAIL on unfixed code
    // Failure confirms the bug: module is missing
    expect(
      existsSync(registryPath),
      `Bug B1.2 confirmed: src/adapters/registry.ts does not exist. ` +
      `This causes TS2307: Cannot find module './adapters/registry.js' in src/index.ts`
    ).toBe(true);
  });

  it("should confirm GrpcKernelBusClient can be imported from bus/grpc-client", async () => {
    // This test EXPECTS to FAIL on unfixed code with import error
    try {
      const module = await import("../../src/bus/grpc-client.js");
      expect(module.GrpcKernelBusClient).toBeDefined();
      expect(typeof module.GrpcKernelBusClient).toBe("function");
    } catch (error: any) {
      // Document the counterexample
      throw new Error(
        `Bug B1.1 confirmed: Cannot import GrpcKernelBusClient. ` +
        `Error: ${error.message}. ` +
        `This confirms the module is missing and causes compilation failure.`
      );
    }
  });

  it("should confirm LLMAdapterRegistry can be imported from adapters/registry", async () => {
    // This test EXPECTS to FAIL on unfixed code with import error
    try {
      const module = await import("../../src/adapters/registry.js");
      expect(module.LLMAdapterRegistry).toBeDefined();
      expect(typeof module.LLMAdapterRegistry).toBe("function");
    } catch (error: any) {
      // Document the counterexample
      throw new Error(
        `Bug B1.2 confirmed: Cannot import LLMAdapterRegistry. ` +
        `Error: ${error.message}. ` +
        `This confirms the module is missing and causes compilation failure.`
      );
    }
  });
});
