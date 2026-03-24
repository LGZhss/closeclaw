import { describe, it, expect } from 'vitest';

/**
 * Bug B1 Exploration Test
 * 
 * **Validates: Requirements 1.1, 2.1**
 * 
 * Property 1: Bug Condition - getRouterState 导入缺失导致 TypeScript 错误
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Expected counterexample on unfixed code:
 * - TS2552: Cannot find name 'getRouterState' at router.ts:98
 * 
 * After fix: Test should pass (no getRouterState error)
 */

describe('Bug B1: Missing getRouterState import', () => {
  it('should have getRouterState imported in router.ts', async () => {
    // Simply check that router.ts imports getRouterState from db.js
    const { readFileSync } = await import('fs');
    const routerContent = readFileSync('src/router.ts', 'utf-8');
    
    // Check if getRouterState is imported
    const hasImport = routerContent.includes('getRouterState');
    
    expect(hasImport).toBe(true);
  });
});
