import { pino } from "pino";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

export const logLevels = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50,
} as const;

type LogLevel = keyof typeof logLevels;

const levelToMethod: Record<
  LogLevel,
  "debug" | "info" | "warn" | "error" | "fatal"
> = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
};

export function log(message: string, level: LogLevel = "INFO") {
  const method = levelToMethod[level] ?? "info";
  logger[method](message);
}

export function groupLog(
  folder: string,
  message: string,
  level: LogLevel = "INFO",
) {
  log(`[${folder}] ${message}`, level);
}
