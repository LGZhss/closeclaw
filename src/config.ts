import path from "path";

export const ASSISTANT_NAME = process.env.ASSISTANT_NAME || "Andy";
export const POLL_INTERVAL = 2000;
export const SCHEDULER_POLL_INTERVAL = 60000;

// Paths are absolute
const PROJECT_ROOT = process.cwd();
export const STORE_DIR = path.resolve(PROJECT_ROOT, "store");
export const GROUPS_DIR = path.resolve(PROJECT_ROOT, "groups");
export const DATA_DIR = path.resolve(PROJECT_ROOT, "data");

// Agent concurrency
export const IPC_POLL_INTERVAL = 1000;
export const MAX_CONCURRENT_AGENTS = Math.max(
  1,
  parseInt(process.env.MAX_CONCURRENT_AGENTS || "5", 10) || 5,
);

export const TRIGGER_PATTERN = new RegExp(`^@${ASSISTANT_NAME}\\b`, "i");
