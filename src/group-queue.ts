import { logger } from "./logger.js";
import { MAX_CONCURRENT_CONTAINERS } from "./config.js";

/**
 * Group queue item
 */
interface QueueItem {
  groupFolder: string;
  execute: () => Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Per-group queue with global concurrency limit
 */
export class GroupQueue {
  private groupQueues = new Map<string, QueueItem[]>();
  private groupProcessing = new Map<string, boolean>();
  private activeContainers = 0;
  private waitingQueue: QueueItem[] = [];

  constructor(private maxConcurrent: number = MAX_CONCURRENT_CONTAINERS) {}

  /**
   * Add a task to the group queue
   */
  async enqueue(
    groupFolder: string,
    execute: () => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const item: QueueItem = {
        groupFolder,
        execute,
        resolve,
        reject,
      };

      // Get or create group queue
      let queue = this.groupQueues.get(groupFolder);
      if (!queue) {
        queue = [];
        this.groupQueues.set(groupFolder, queue);
      }

      // Add to group queue
      queue.push(item);

      // Try to process
      this.processQueue(groupFolder);
    });
  }

  /**
   * Process the queue for a specific group
   */
  private async processQueue(groupFolder: string): Promise<void> {
    const queue = this.groupQueues.get(groupFolder);
    const isProcessing = this.groupProcessing.get(groupFolder);

    if (!queue || queue.length === 0 || isProcessing) {
      return;
    }

    // Check global concurrency limit
    if (this.activeContainers >= this.maxConcurrent) {
      logger.debug(
        `Concurrency limit reached (${this.activeContainers}/${this.maxConcurrent})`,
      );
      return;
    }

    // Mark group as processing
    this.groupProcessing.set(groupFolder, true);

    // Get next item from queue
    const item = queue.shift();
    if (!item) {
      this.groupProcessing.set(groupFolder, false);
      return;
    }

    // Increment active containers
    this.activeContainers++;

    try {
      logger.debug(
        `Executing task for group: ${groupFolder} (active: ${this.activeContainers})`,
      );
      await item.execute();
      item.resolve();
    } catch (error) {
      logger.error(`Task failed for group ${groupFolder}: ${error}`);
      item.reject(error as Error);
    } finally {
      // Decrement active containers
      this.activeContainers--;

      // Mark group as not processing
      this.groupProcessing.set(groupFolder, false);

      // Process next item in group queue
      this.processQueue(groupFolder);

      // Try to process waiting queue
      this.processWaitingQueue();
    }
  }

  /**
   * Process waiting queue items
   */
  private processWaitingQueue(): void {
    if (this.waitingQueue.length === 0) {
      return;
    }

    if (this.activeContainers >= this.maxConcurrent) {
      return;
    }

    const item = this.waitingQueue.shift();
    if (item) {
      // Add to group queue and process
      let queue = this.groupQueues.get(item.groupFolder);
      if (!queue) {
        queue = [];
        this.groupQueues.set(item.groupFolder, queue);
      }
      queue.push(item);
      this.processQueue(item.groupFolder);
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    activeContainers: number;
    maxConcurrent: number;
    groupQueues: Map<string, number>;
    waitingQueue: number;
  } {
    const groupQueueSizes = new Map<string, number>();
    for (const [group, queue] of this.groupQueues.entries()) {
      groupQueueSizes.set(group, queue.length);
    }

    return {
      activeContainers: this.activeContainers,
      maxConcurrent: this.maxConcurrent,
      groupQueues: groupQueueSizes,
      waitingQueue: this.waitingQueue.length,
    };
  }

  /**
   * Clear all queues (for testing)
   */
  clear(): void {
    this.groupQueues.clear();
    this.groupProcessing.clear();
    this.waitingQueue = [];
    this.activeContainers = 0;
  }
}

// Export singleton instance
export const groupQueue = new GroupQueue();
