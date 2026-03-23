import fs from "fs";
import path from "path";
import * as chokidar from "chokidar";
import { DATA_DIR } from "./config.js";
import { logger } from "./logger.js";

const IPC_DIR = path.join(DATA_DIR, "ipc");
const MESSAGES_DIR = path.join(IPC_DIR, "messages");
const TASKS_DIR = path.join(IPC_DIR, "tasks");

/**
 * IPC Message structure
 */
export interface IPCMessage {
  id: string;
  groupFolder: string;
  text: string;
  timestamp: number;
}

/**
 * IPC Task structure
 */
export interface IPCTask {
  id: string;
  groupFolder: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

/**
 * Ensure IPC directories exist
 */
function ensureIpcDirs() {
  fs.mkdirSync(MESSAGES_DIR, { recursive: true });
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

/**
 * Write a message to IPC
 */
export function writeMessage(message: IPCMessage): void {
  ensureIpcDirs();
  const filePath = path.join(MESSAGES_DIR, `${message.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
  logger.debug(`IPC message written: ${message.id}`);
}

/**
 * Read and delete a message from IPC
 */
export function readMessage(messageId: string): IPCMessage | null {
  const filePath = path.join(MESSAGES_DIR, `${messageId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const message = JSON.parse(content) as IPCMessage;

    // Delete the file after reading
    fs.unlinkSync(filePath);

    return message;
  } catch (error) {
    logger.error(`Failed to read IPC message ${messageId}: ${error}`);
    return null;
  }
}

/**
 * Get all pending messages
 */
export async function getPendingMessages(): Promise<IPCMessage[]> {
  ensureIpcDirs();
  const messages: IPCMessage[] = [];

  try {
    const files = await fs.promises.readdir(MESSAGES_DIR);

    // Process files concurrently to avoid blocking event loop
    const messagePromises = files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const filePath = path.join(MESSAGES_DIR, file);
        try {
          const content = await fs.promises.readFile(filePath, "utf8");
          return JSON.parse(content) as IPCMessage;
        } catch (error) {
          logger.warn(`Failed to read IPC message file ${file}: ${error}`);
          return null;
        }
      });

    const results = await Promise.all(messagePromises);
    for (const msg of results) {
      if (msg) messages.push(msg);
    }
  } catch (error) {
    logger.error(`Failed to read messages directory: ${error}`);
  }

  return messages;
}

/**
 * Write a task result to IPC
 */
export function writeTaskResult(
  taskId: string,
  result: string,
  error?: string,
): void {
  ensureIpcDirs();
  const filePath = path.join(TASKS_DIR, `${taskId}.json`);

  const task: IPCTask = {
    id: taskId,
    groupFolder: taskId.split("_")[0], // Extract group folder from task ID
    prompt: "",
    status: error ? "failed" : "completed",
    result: error ? undefined : result,
    error: error,
    createdAt: Date.now(),
    completedAt: Date.now(),
  };

  fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
  logger.debug(`IPC task result written: ${taskId}`);
}

/**
 * Read and delete a task result from IPC
 */
export function readTaskResult(taskId: string): IPCTask | null {
  const filePath = path.join(TASKS_DIR, `${taskId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const task = JSON.parse(content) as IPCTask;

    // Delete the file after reading
    fs.unlinkSync(filePath);

    return task;
  } catch (error) {
    logger.error(`Failed to read IPC task result ${taskId}: ${error}`);
    return null;
  }
}

/**
 * Watch IPC directories for changes
 */
export function watchIPC(
  onMessage: (message: IPCMessage) => void,
  onTaskResult: (task: IPCTask) => void,
): () => void {
  ensureIpcDirs();

  const watcher = chokidar.watch([MESSAGES_DIR, TASKS_DIR], {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("add", (filePath: string) => {
    const fileName = path.basename(filePath);

    if (MESSAGES_DIR.includes(filePath) && fileName.endsWith(".json")) {
      // New message
      const messageId = fileName.replace(".json", "");
      const message = readMessage(messageId);
      if (message) {
        onMessage(message);
      }
    } else if (TASKS_DIR.includes(filePath) && fileName.endsWith(".json")) {
      // Task result
      const taskId = fileName.replace(".json", "");
      const task = readTaskResult(taskId);
      if (task) {
        onTaskResult(task);
      }
    }
  });

  logger.info("IPC watcher started");

  // Return cleanup function
  return () => {
    watcher.close()
      .then(() => {
        logger.info("IPC watcher stopped");
      })
      .catch((err: Error) => {
        logger.error(`Error closing IPC watcher: ${err.message}`);
      });
  };
}

/**
 * Poll IPC for messages (alternative to watcher)
 */
export async function pollIPC(
  onMessage: (message: IPCMessage) => void,
  _onTaskResult: (task: IPCTask) => void,
): Promise<void> {
  const messages = await getPendingMessages();
  for (const message of messages) {
    onMessage(message);
  }

  // Task results are handled separately
  // This is mainly for container-to-host communication
}

/**
 * Clean up old IPC files
 */
export async function cleanupIPC(maxAge: number = 3600000): Promise<void> {
  const now = Date.now();

  const dirs = [MESSAGES_DIR, TASKS_DIR];

  await Promise.all(
    dirs.map(async (dir) => {
      try {
        const files = await fs.promises.readdir(dir);

        const cleanupPromises = files
          .filter((file) => file.endsWith(".json"))
          .map(async (file) => {
            const filePath = path.join(dir, file);
            try {
              const stats = await fs.promises.stat(filePath);
              if (now - stats.mtimeMs > maxAge) {
                await fs.promises.unlink(filePath);
                logger.debug(`Cleaned up old IPC file: ${file}`);
              }
            } catch (error) {
              logger.warn(`Failed to stat IPC file ${file}: ${error}`);
            }
          });

        await Promise.all(cleanupPromises);
      } catch (error) {
        logger.error(`Failed to cleanup IPC directory ${dir}: ${error}`);
      }
    }),
  );
}
