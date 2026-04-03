/**
 * LLM适配器注册表
 * 管理多个LLM提供商的适配器
 *
 * 基于P027架构规范：
 * TypeScript层负责具体SDK调用，通过适配器模式统一接口
 */

import { logger } from "../logger.js";

/**
 * LLM适配器接口
 * 所有LLM提供商适配器必须实现此接口
 */
export interface LLMAdapter {
  /** 适配器名称（如 "openrouter", "anthropic", "zhipu"） */
  name: string;

  /**
   * 执行聊天请求
   * @param params 聊天参数（模型、消息、温度等）
   * @returns 聊天响应
   */
  chat(params: any): Promise<any>;
}

/**
 * LLM适配器注册表
 *
 * 管理所有LLM提供商的适配器实例
 * 支持动态注册和获取适配器
 */
export class LLMAdapterRegistry {
  /** 适配器存储 Map<适配器名称, 适配器实例> */
  private adapters: Map<string, LLMAdapter>;

  /**
   * 创建LLM适配器注册表
   * 自动注册默认适配器
   */
  constructor() {
    this.adapters = new Map();
    logger.debug(`[LLMAdapterRegistry] Initializing...`);

    this.registerDefaultAdapters();

    logger.info(
      `[LLMAdapterRegistry] Initialized with ${this.adapters.size} adapters`,
    );
  }

  /**
   * 注册默认适配器
   *
   * 支持的提供商：
   * - OpenRouter (350+ models)
   * - Anthropic (Claude)
   * - Zhipu (智谱AI, 推荐中文场景)
   * - OpenAI
   * - GitHub Models
   * - SiliconFlow
   * - Cerebras
   * - Google Gemini
   * - ModelScope
   * - Mistral
   * - Groq
   * - Cohere
   * - Hyperbolic
   * - Databricks
   */
  private registerDefaultAdapters(): void {
    // TODO: 实际注册各个LLM提供商的适配器
    // 当前为基础实现，确保编译通过
    // 后续需要实现具体的适配器类

    logger.debug(`[LLMAdapterRegistry] Default adapters registered`);
  }

  /**
   * 注册新的LLM适配器
   *
   * @param adapter 要注册的适配器实例
   * @throws 如果适配器名称已存在，会覆盖旧的适配器
   */
  register(adapter: LLMAdapter): void {
    if (this.adapters.has(adapter.name)) {
      logger.warn(
        `[LLMAdapterRegistry] Overwriting existing adapter: ${adapter.name}`,
      );
    }

    this.adapters.set(adapter.name, adapter);
    logger.info(`[LLMAdapterRegistry] Registered adapter: ${adapter.name}`);
  }

  /**
   * 获取指定名称的LLM适配器
   *
   * @param name 适配器名称
   * @returns 适配器实例
   * @throws 如果适配器不存在，抛出错误
   */
  get(name: string): LLMAdapter {
    const adapter = this.adapters.get(name);

    if (!adapter) {
      const availableAdapters = Array.from(this.adapters.keys()).join(", ");
      logger.error(`[LLMAdapterRegistry] Adapter not found: ${name}`);
      throw new Error(
        `LLM adapter not found: ${name}. ` +
          `Available adapters: ${availableAdapters || "none"}`,
      );
    }

    logger.debug(`[LLMAdapterRegistry] Retrieved adapter: ${name}`);
    return adapter;
  }

  /**
   * 检查适配器是否已注册
   *
   * @param name 适配器名称
   * @returns 是否已注册
   */
  has(name: string): boolean {
    return this.adapters.has(name);
  }

  /**
   * 获取所有已注册的适配器名称
   *
   * @returns 适配器名称数组
   */
  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 移除指定的适配器
   *
   * @param name 适配器名称
   * @returns 是否成功移除
   */
  unregister(name: string): boolean {
    const removed = this.adapters.delete(name);

    if (removed) {
      logger.info(`[LLMAdapterRegistry] Unregistered adapter: ${name}`);
    } else {
      logger.warn(
        `[LLMAdapterRegistry] Adapter not found for removal: ${name}`,
      );
    }

    return removed;
  }

  /**
   * 清空所有适配器
   */
  clear(): void {
    const count = this.adapters.size;
    this.adapters.clear();
    logger.info(`[LLMAdapterRegistry] Cleared ${count} adapters`);
  }

  /**
   * 获取已注册适配器数量
   */
  get size(): number {
    return this.adapters.size;
  }
}
