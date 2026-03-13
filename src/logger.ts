import pino from 'pino';
import { GROUPS_DIR } from './config.js';

const pretty = pino.pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});

export const logger = pino(pretty);

export const logLevels = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50,
};

export function log(message: string, level: keyof typeof logLevels = 'INFO') {
  const logLevel = logLevels[level] || logLevels.INFO;
  logger[level.toLowerCase() as keyof typeof logger]({ msg: message });
}

export function groupLog(folder: string, message: string, level: keyof typeof logLevels = 'INFO') {
  log(`[${folder}] ${message}`, level);
}
