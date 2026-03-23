import { ChannelFactory } from "../types.js";

const registry = new Map<string, ChannelFactory>();

/**
 * Register a channel factory
 */
export function registerChannel(name: string, factory: ChannelFactory): void {
  registry.set(name, factory);
}

/**
 * Get a channel factory by name
 */
export function getChannelFactory(name: string): ChannelFactory | undefined {
  return registry.get(name);
}

/**
 * Get all registered channel names
 */
export function getRegisteredChannelNames(): string[] {
  return [...registry.keys()];
}

/**
 * Clear all registered channels (for testing)
 */
export function clearRegistry(): void {
  registry.clear();
}
