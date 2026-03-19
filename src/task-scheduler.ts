import cronParser from 'cron-parser';
const parseExpression = (cronParser as any).parseExpression || (cronParser as any).parse || (cronParser as any).default?.parse || (cronParser as any).CronExpressionParser?.parse;
import { getDueTasks, updateTaskNextRun, insertTaskLog } from './db.js';
import { logger } from './logger.js';
import { ScheduledTask } from './types.js';
import { SCHEDULER_POLL_INTERVAL } from './config.js';

/**
 * Calculate next run time for a task
 */
export function calculateNextRun(task: ScheduledTask): Date | null {
  try {
    switch (task.schedule_type) {
      case 'cron':
        const interval = parseExpression(task.schedule_value);
        return interval.next().toDate();

      case 'interval':
        const intervalMs = parseInt(task.schedule_value, 10);
        return new Date(Date.now() + intervalMs);

      case 'once':
        return new Date(task.schedule_value);

      default:
        logger.warn(`Unknown schedule type: ${task.schedule_type}`);
        return null;
    }
  } catch (error) {
    logger.error(`Failed to calculate next run for task ${task.id}: ${error}`);
    return null;
  }
}

/**
 * Process due tasks
 */
export async function processDueTasks(
  executeTask: (task: ScheduledTask) => Promise<void>
): Promise<void> {
  const now = new Date();
  const dueTasks = getDueTasks(now);

  if (dueTasks.length === 0) {
    return;
  }

  logger.info(`Processing ${dueTasks.length} due task(s)`);

  for (const task of dueTasks) {
    try {
      logger.info(`Executing task ${task.id} for group ${task.group_folder}`);

      // Log task start
      insertTaskLog({
        task_id: task.id,
        started_at: now.toISOString(),
        completed_at: undefined,
        result: undefined,
        error: undefined,
      });

      // Execute the task
      await executeTask(task);

      // Calculate next run time
      const nextRun = calculateNextRun(task);
      if (nextRun) {
        updateTaskNextRun(task.id, nextRun.toISOString());
        logger.info(`Task ${task.id} scheduled for ${nextRun.toISOString()}`);
      } else {
        // One-time task or invalid schedule - mark as completed
        logger.info(`Task ${task.id} completed (no next run)`);
      }

      // Log task completion
      insertTaskLog({
        task_id: task.id,
        started_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        result: 'Completed successfully',
        error: undefined,
      });
    } catch (error) {
      logger.error(`Task ${task.id} failed: ${error}`);

      // Log task error
      insertTaskLog({
        task_id: task.id,
        started_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        result: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Still calculate next run for recurring tasks
      const nextRun = calculateNextRun(task);
      if (nextRun) {
        updateTaskNextRun(task.id, nextRun.toISOString());
      }
    }
  }
}

/**
 * Start the scheduler loop
 */
export function startScheduler(
  executeTask: (task: ScheduledTask) => Promise<void>
): () => void {
  logger.info('Scheduler started');

  // Process tasks immediately
  processDueTasks(executeTask);

  // Set up polling interval
  const intervalId = setInterval(() => {
    processDueTasks(executeTask).catch((error) => {
      logger.error(`Scheduler error: ${error}`);
    });
  }, SCHEDULER_POLL_INTERVAL);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    logger.info('Scheduler stopped');
  };
}

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): boolean {
  try {
    parseExpression(expression);
    return true;
  } catch {
    return false;
  }
}
