import { LLMAdapter } from "./base.js";

/**
 * Adapter 工厂函数类型
 */
export type AdapterFactory = () => LLMAdapter;

/**
 * Adapter 注册表
 */
const registry = new Map<string, AdapterFactory>();

/**
 * 注册 Adapter 工厂
 * @param name Adapter 名称
 * @param factory Adapter 工厂函数
 */
export function registerAdapter(name: string, factory: AdapterFactory): void {
  registry.set(name, factory);
}

/**
 * 获取 Adapter 实例
 * @param name Adapter 名称
 * @returns Adapter 实例，如果不存在则返回 null
 */
export function getAdapter(name: string): LLMAdapter | null {
  const factory = registry.get(name);
  if (!factory) {
    return null;
  }
  return factory();
}

/**
 * 获取所有已注册的 Adapter 名称
 * @returns Adapter 名称数组
 */
export function getRegisteredAdapterNames(): string[] {
  return [...registry.keys()];
}

/**
 * 清空注册表（仅用于测试）
 * @internal
 */
export function clearRegistry(): void {
  registry.clear();
}
