import path from "path";

export const ASSISTANT_NAME = process.env.ASSISTANT_NAME || "Andy";
export const POLL_INTERVAL = 2000;
export const SCHEDULER_POLL_INTERVAL = 60000;

// Paths are absolute (required for container mounts)
const PROJECT_ROOT = process.cwd();
export const STORE_DIR = path.resolve(PROJECT_ROOT, "store");
export const GROUPS_DIR = path.resolve(PROJECT_ROOT, "groups");
export const DATA_DIR = path.resolve(PROJECT_ROOT, "data");

// Container configuration
export const CONTAINER_IMAGE =
  process.env.CONTAINER_IMAGE || "closeclaw-agent:latest";
export const CONTAINER_TIMEOUT = parseInt(
  process.env.CONTAINER_TIMEOUT || "1800000",
  10,
); // 30min default
export const IPC_POLL_INTERVAL = 1000;
export const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT || "1800000", 10); // 30min — keep container alive after last result
export const MAX_CONCURRENT_CONTAINERS = Math.max(
  1,
  parseInt(process.env.MAX_CONCURRENT_CONTAINERS || "5", 10) || 5,
);

export const TRIGGER_PATTERN = new RegExp(`^@${ASSISTANT_NAME}\\b`, "i");
