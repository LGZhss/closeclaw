import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Bug C7 Exploration Test
 * 
 * **Validates: Requirements 1.5, 2.5**
 * 
 * Property 1: Bug Condition - activeContainers 变量名与当前架构不符
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Expected counterexample on unfixed code:
 * - group-queue.ts uses activeContainers variable name
 * - getStats method returns activeContainers field
 */

describe('Bug C7: Outdated activeContainers variable name', () => {
  it('should detect activeContainers variable in group-queue.ts', () => {
    const queuePath = path.join(process.cwd(), 'src', 'group-queue.ts');
    const queueContent = readFileSync(queuePath, 'utf-8');

    // Check for activeContainers variable name
    const hasActiveContainers = queueContent.includes('activeContainers');

    if (hasActiveContainers) {
      throw new Error(
        `Bug C7 confirmed: activeContainers variable found in group-queue.ts\n` +
        `This variable name is outdated - should be activeAgents to reflect current architecture`
      );
    }

    // If we get here, the variable name is correct
    expect(hasActiveContainers).toBe(false);
  });

  it('should verify activeAgents variable is used instead', () => {
    const queuePath = path.join(process.cwd(), 'src', 'group-queue.ts');
    const queueContent = readFileSync(queuePath, 'utf-8');

    // After fix, should use activeAgents
    const hasActiveAgents = queueContent.includes('activeAgents');

    // This will fail on unfixed code
    expect(hasActiveAgents).toBe(true);
  });

  it('should verify getStats returns activeAgents field', () => {
    const queuePath = path.join(process.cwd(), 'src', 'group-queue.ts');
    const queueContent = readFileSync(queuePath, 'utf-8');

    // Check getStats method return type
    const getStatsMatch = queueContent.match(/getStats\(\)[\s\S]*?{[\s\S]*?return\s*{[\s\S]*?}/);
    
    if (getStatsMatch) {
      const getStatsBody = getStatsMatch[0];
      
      // Should return activeAgents, not activeContainers
      const returnsActiveContainers = getStatsBody.includes('activeContainers:');
      const returnsActiveAgents = getStatsBody.includes('activeAgents:');

      if (returnsActiveContainers) {
        throw new Error(
          `Bug C7 confirmed: getStats returns activeContainers field\n` +
          `Should return activeAgents instead`
        );
      }

      expect(returnsActiveAgents).toBe(true);
    }
  });
});
