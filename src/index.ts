import {
  Channel,
  ChannelOpts,
  IncomingMessage,
} from "./types.js";
import {
  getChannelFactory,
  getRegisteredChannelNames,
} from "./channels/registry.js";
import "./channels/index.js"; // Trigger channel self-registration
import "./adapters/openai.js"; // Trigger adapter self-registration
import {
  insertMessage,
  getUnprocessedMessages,
  markMessagesProcessed,
  getMainGroup,
  setRegisteredGroup,
  getRegisteredGroup,
} from "./db.js";
import { logger } from "./logger.js";
import { POLL_INTERVAL, GROUPS_DIR, ASSISTANT_NAME } from "./config.js";
import { processGroupMessages, formatResponse } from "./router.js";
import { groupQueue } from "./group-queue.js";
import { startScheduler } from "./task-scheduler.js";
import { ScheduledTask } from "./types.js";
import { SandboxRunner } from "./agent/sandbox-runner.js";

import { mkdirSync, existsSync } from "fs";
import path from "path";

// Store connected channels
const channels: Channel[] = [];

/**
 * Handle incoming message from channel
 */
async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  try {
    logger.debug(
      `Received message from ${message.senderName} via ${message.channel}`,
    );

    // Store message in database
    const msgId = insertMessage({
      id: 0, // Will be auto-generated
      channel: message.channel,
      chat_jid: message.chatJid,
      sender_jid: message.senderJid,
      sender_name: message.senderName,
      text: message.text,
      timestamp: message.timestamp,
      is_group: message.isGroup,
      group_name: message.groupName,
      processed: false,
      created_at: new Date().toISOString(),
    });

    logger.debug(`Message stored with ID: ${msgId}`);
  } catch (error) {
    logger.error(`Failed to handle incoming message: ${error}`);
  }
}

/**
 * Build channel options
 */
function buildChannelOpts(): ChannelOpts {
  return {
    onMessage: handleIncomingMessage,
    onChatMetadata: (metadata) => {
      logger.debug(`Chat metadata: ${metadata.name} (${metadata.jid})`);
    },
    registeredGroups: (groups) => {
      logger.debug(`Registered groups updated: ${groups.length} groups`);
    },
  };
}

/**
 * Connect all available channels
 */
async function connectChannels(): Promise<void> {
  const channelOpts = buildChannelOpts();
  const registeredNames = getRegisteredChannelNames();

  logger.info(
    `Found ${registeredNames.length} registered channel(s): ${registeredNames.join(", ")}`,
  );

  for (const name of registeredNames) {
    try {
      const factory = getChannelFactory(name);
      if (!factory) {
        logger.warn(`Channel factory not found: ${name}`);
        continue;
      }

      const channel = factory(channelOpts);
      if (!channel) {
        logger.warn(`Channel ${name} returned null (missing credentials?)`);
        continue;
      }

      await channel.connect();
      channels.push(channel);
      logger.info(`Channel connected: ${name}`);
    } catch (error) {
      logger.error(`Failed to connect channel ${name}: ${error}`);
    }
  }

  if (channels.length === 0) {
    logger.warn("No channels connected. Add credentials to enable channels.");
  }
}

/**
 * Process messages for a group
 */
async function processGroup(groupFolder: string): Promise<void> {
  await groupQueue.enqueue(groupFolder, async () => {
    const result = await processGroupMessages(groupFolder, channels);

    if (!result.hasMessages || !result.prompt || !result.channel) {
      return;
    }

    try {
      logger.info(`Running agent for group: ${groupFolder}`);

      // Create SandboxRunner instance
      const runner = new SandboxRunner('openai');
      
      // Build execution context
      const context = {
        groupFolder,
        prompt: result.prompt,
        channel: result.channel,
        history: []
      };
      
      // Execute agent
      const response = await runner.execute(context);
      
      // Send response through channel
      const formattedResponse = formatResponse(response);
      await result.channel.sendMessage(result.channel.name, formattedResponse);
      
      // Cleanup
      await runner.close();
    } catch (error) {
      logger.error(`Failed to process group ${groupFolder}: ${error}`);
      if (result.channel) {
        await result.channel.sendMessage(
          result.channel.name,
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  });
}

/**
 * Start the message polling loop
 */
function startMessageLoop(): () => void {
  logger.info("Message loop started");

  const intervalId = setInterval(async () => {
    try {
      const unprocessed = getUnprocessedMessages(100);

      if (unprocessed.length === 0) {
        return;
      }

      // Group messages by chat_jid
      const groupedMessages = new Map<string, typeof unprocessed>();
      for (const msg of unprocessed) {
        const existing = groupedMessages.get(msg.chat_jid) || [];
        existing.push(msg);
        groupedMessages.set(msg.chat_jid, existing);
      }

      // Process each group
      for (const [chatJid, messages] of groupedMessages.entries()) {
        // Look up the group by chatJid to get the correct folder
        const group = getRegisteredGroup(chatJid);
        if (!group) {
          logger.warn(`No registered group found for chatJid: ${chatJid}`);
          markMessagesProcessed(messages.map(m => m.id));
          continue;
        }

        await processGroup(group.folder);
      }
    } catch (error) {
      logger.error(`Message loop error: ${error}`);
    }
  }, POLL_INTERVAL);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    logger.info("Message loop stopped");
  };
}

/**
 * Execute a scheduled task
 */
async function executeScheduledTask(task: ScheduledTask): Promise<void> {
  logger.info(`Executing scheduled task ${task.id}`);

  try {
    // Create SandboxRunner instance
    const runner = new SandboxRunner('openai');
    
    // Build execution context (for scheduled tasks, we use a dummy channel)
    const context = {
      groupFolder: 'main',
      prompt: task.prompt,
      channel: channels[0] || ({} as Channel), // Use first available channel or dummy
      history: []
    };
    
    // Execute agent
    const response = await runner.execute(context);
    
    logger.info(`Task ${task.id} completed with response: ${response.substring(0, 100)}...`);
    
    // Cleanup
    await runner.close();
  } catch (error) {
    logger.error(`Task ${task.id} execution error: ${error}`);
    throw error;
  }
}

/**
 * Initialize the main group
 */
function initializeMainGroup(): void {
  const mainGroupPath = path.join(GROUPS_DIR, "main");

  if (!existsSync(mainGroupPath)) {
    mkdirSync(mainGroupPath, { recursive: true });
    logger.info("Created main group directory");
  }

  // Register main group if not exists
  const mainGroup = getMainGroup();
  if (!mainGroup) {
    setRegisteredGroup("main", {
      jid: "main",
      name: "Main",
      folder: "main",
      channel: "main",
      isMain: true,
      added_at: new Date().toISOString(),
    });
    logger.info("Registered main group");
  }
}

/**
 * Main initialization
 */
async function main(): Promise<void> {
  logger.info(`Starting ${ASSISTANT_NAME}...`);

  try {
    // Ensure directories exist
    initializeMainGroup();

    // Connect channels
    await connectChannels();

    if (channels.length === 0) {
      logger.warn(
        "No channels available. Please add credentials to enable channels.",
      );
      logger.info("Running in limited mode (scheduler and main group only)");
    }

    // Start scheduler
    const stopScheduler = startScheduler(executeScheduledTask);

    // Start message loop
    const stopMessageLoop = startMessageLoop();

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, "Shutting down...");
      stopScheduler();
      stopMessageLoop();
      await Promise.all(channels.map((ch) => ch.disconnect()));
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    logger.info(`${ASSISTANT_NAME} is ready`);
  } catch (error) {
    logger.error(`Failed to start: ${error}`);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
