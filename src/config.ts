import path from "path";

export const ASSISTANT_NAME = process.env.ASSISTANT_NAME || "Andy";
export const POLL_INTERVAL = 2000;
export const SCHEDULER_POLL_INTERVAL = 60000;

// Paths are absolute (required for container mounts)
const PROJECT_ROOT = process.cwd();
export const DATA_DIR = path.resolve(PROJECT_ROOT, "data");
export const GROUPS_DIR = path.resolve(DATA_DIR, "groups");

export const MAX_CONCURRENT_CONTAINERS = Math.max(1, parseInt(process.env.MAX_CONCURRENT_CONTAINERS || '5', 10) || 5);

export const TRIGGER_PATTERN = new RegExp(`^@${ASSISTANT_NAME}\\b`, "i");

export const config = {
  sandbox: {
    timeout: 30000, // 30 seconds
    memoryLimit: '512m'
  }
};
