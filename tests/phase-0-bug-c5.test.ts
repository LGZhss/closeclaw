import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Bug C5 Exploration Test
 * 
 * **Validates: Requirements 1.4, 2.4**
 * 
 * Property 1: Bug Condition - 容器相关类型和配置仍然存在
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Expected counterexample on unfixed code:
 * - types.ts contains ContainerConfig and MountConfig definitions
 * - config.ts contains CONTAINER_IMAGE, CONTAINER_TIMEOUT, IDLE_TIMEOUT constants
 * - db.ts schema contains container_config field
 */

describe('Bug C5: Container-related code remnants', () => {
  it('should detect container-related types in types.ts', () => {
    const typesPath = path.join(process.cwd(), 'src', 'types.ts');
    const typesContent = readFileSync(typesPath, 'utf-8');

    // Check for ContainerConfig type
    const hasContainerConfig = typesContent.includes('ContainerConfig');
    
    // Check for MountConfig type
    const hasMountConfig = typesContent.includes('MountConfig');
    
    // Check for containerConfig field in RegisteredGroup
    const hasContainerConfigField = typesContent.includes('containerConfig');

    if (hasContainerConfig || hasMountConfig || hasContainerConfigField) {
      throw new Error(
        `Bug C5 confirmed: Container-related types found in types.ts\n` +
        `- ContainerConfig: ${hasContainerConfig}\n` +
        `- MountConfig: ${hasMountConfig}\n` +
        `- containerConfig field: ${hasContainerConfigField}`
      );
    }

    // If we get here, the types are clean
    expect(hasContainerConfig).toBe(false);
    expect(hasMountConfig).toBe(false);
    expect(hasContainerConfigField).toBe(false);
  });

  it('should detect container-related constants in config.ts', () => {
    const configPath = path.join(process.cwd(), 'src', 'config.ts');
    const configContent = readFileSync(configPath, 'utf-8');

    // Check for container-related constants
    const hasContainerImage = configContent.includes('CONTAINER_IMAGE');
    const hasContainerTimeout = configContent.includes('CONTAINER_TIMEOUT');
    const hasIdleTimeout = configContent.includes('IDLE_TIMEOUT');

    if (hasContainerImage || hasContainerTimeout || hasIdleTimeout) {
      throw new Error(
        `Bug C5 confirmed: Container-related constants found in config.ts\n` +
        `- CONTAINER_IMAGE: ${hasContainerImage}\n` +
        `- CONTAINER_TIMEOUT: ${hasContainerTimeout}\n` +
        `- IDLE_TIMEOUT: ${hasIdleTimeout}`
      );
    }

    // If we get here, the config is clean
    expect(hasContainerImage).toBe(false);
    expect(hasContainerTimeout).toBe(false);
    expect(hasIdleTimeout).toBe(false);
  });

  it('should detect container_config field in db.ts schema', () => {
    const dbPath = path.join(process.cwd(), 'src', 'db.ts');
    const dbContent = readFileSync(dbPath, 'utf-8');

    // Check for container_config field in CREATE TABLE statement
    const hasContainerConfigField = dbContent.includes('container_config');

    if (hasContainerConfigField) {
      throw new Error(
        `Bug C5 confirmed: container_config field found in db.ts schema`
      );
    }

    // If we get here, the schema is clean
    expect(hasContainerConfigField).toBe(false);
  });
});
