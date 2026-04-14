import path from "path";
import { z } from "zod";

const envSchema = z.object({
  ASSISTANT_NAME: z.string().trim().min(1).default("Andy"),
  MAX_CONCURRENT_CONTAINERS: z.coerce.number().int().min(1).default(5),
});

const env = envSchema.parse(process.env);

export const ASSISTANT_NAME = env.ASSISTANT_NAME;
export const POLL_INTERVAL = 2000;
export const SCHEDULER_POLL_INTERVAL = 60000;

// Paths are absolute (required for container mounts)
const PROJECT_ROOT = process.cwd();
export const DATA_DIR = path.resolve(PROJECT_ROOT, "data");
export const GROUPS_DIR = path.resolve(DATA_DIR, "groups");

export const MAX_CONCURRENT_CONTAINERS = env.MAX_CONCURRENT_CONTAINERS;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const TRIGGER_PATTERN = new RegExp(
  `^@${escapeRegExp(ASSISTANT_NAME)}\\b`,
  "i",
);

export const config = {
  sandbox: {
    timeout: 30000, // 30 seconds
    memoryLimit: "512m",
  },
};
