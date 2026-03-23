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
};

export function log(message: string, level: keyof typeof logLevels = "INFO") {
  const method = level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  if (typeof logger[method] === 'function') {
    logger[method](message);
  }
}

export function groupLog(
  folder: string,
  message: string,
  level: keyof typeof logLevels = "INFO",
) {
  log(`[${folder}] ${message}`, level);
}
