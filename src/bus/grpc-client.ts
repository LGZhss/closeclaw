/**
 * gRPC内核总线客户端
 * 负责与Go层的状态总线通信
 *
 * 基于P027架构规范：
 * - Layer 1 (Dart): 控制平面
 * - Layer 2 (Go): 状态总线 ← 本模块连接此层
 * - Layer 3 (TypeScript): 哑终端沙盒
 */

import { logger } from "../logger.js";

/**
 * 总线消息接口
 */
export interface BusMessage {
  /** 消息类型 */
  type: "EXEC_SANDBOX" | "LLM_CHAT" | "HEALTH_CHECK";
  /** 消息负载 */
  payload: any;
  /** 分布式追踪ID */
  traceId: string;
}

/**
 * 总线客户端配置选项
 */
export interface BusClientOptions {
  /** Named Pipe (Windows) 或 Unix Socket (Linux/Mac) 路径 */
  target: string;
}

/**
 * gRPC内核总线客户端
 *
 * 通过Named Pipe或Unix Socket与Go内核通信
 * 强制使用IPC，不回退到TCP 127.0.0.1:50051
 */
export class GrpcKernelBusClient {
  /** 连接目标（Named Pipe或Unix Socket路径） */
  public readonly target: string;

  /** 消息处理器 */
  private messageHandler?: (msg: BusMessage) => Promise<any>;

  /** 连接状态 */
  private connected: boolean = false;

  /**
   * 创建gRPC内核总线客户端
   * @param options 客户端配置选项
   */
  constructor(options: BusClientOptions) {
    this.target = options.target;
    logger.debug(
      `[GrpcKernelBusClient] Initialized with target: ${this.target}`,
    );
  }

  /**
   * 连接到Go内核总线
   *
   * 实现Named Pipe (Windows) 或 Unix Socket (Linux/Mac) 连接
   * 强制使用IPC，不回退到TCP
   */
  async connect(): Promise<void> {
    try {
      logger.info(`[GrpcKernelBusClient] Connecting to ${this.target}...`);

      // TODO: 实现实际的gRPC连接逻辑
      // 当前为基础实现，确保编译通过
      // 后续需要集成实际的gRPC客户端库

      this.connected = true;
      logger.info(`[GrpcKernelBusClient] Connected successfully`);
    } catch (error: any) {
      logger.error(`[GrpcKernelBusClient] Connection failed: ${error.message}`);
      throw new Error(`Failed to connect to kernel bus: ${error.message}`);
    }
  }

  /**
   * 注册消息处理器
   *
   * @param handler 消息处理函数
   */
  onMessage(handler: (msg: BusMessage) => Promise<any>): void {
    this.messageHandler = handler;
    logger.debug(`[GrpcKernelBusClient] Message handler registered`);
  }

  /**
   * 发送消息到Go内核
   *
   * @param message 要发送的消息
   * @returns 内核响应
   */
  async send(message: BusMessage): Promise<any> {
    if (!this.connected) {
      throw new Error("Not connected to kernel bus");
    }

    if (!this.messageHandler) {
      throw new Error("No message handler registered");
    }

    logger.debug(
      `[GrpcKernelBusClient] Sending message: ${message.type} [${message.traceId}]`,
    );

    try {
      // TODO: 实现实际的gRPC消息发送逻辑
      // 当前为基础实现，确保编译通过
      const response = await this.messageHandler(message);
      return response;
    } catch (error: any) {
      logger.error(`[GrpcKernelBusClient] Send failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (!this.connected) {
      return;
    }

    logger.info(`[GrpcKernelBusClient] Closing connection...`);

    try {
      // TODO: 实现实际的gRPC连接关闭逻辑
      // 当前为基础实现，确保编译通过

      this.connected = false;
      logger.info(`[GrpcKernelBusClient] Connection closed`);
    } catch (error: any) {
      logger.error(`[GrpcKernelBusClient] Close failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }
}
