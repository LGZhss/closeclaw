import { getRegisteredGroupByFolder, getMessagesSince, setRouterState, insertMessage, markMessagesProcessed } from './db.js';
import { Channel, DbMessage, RegisteredGroup } from './types.js';
import { TRIGGER_PATTERN, ASSISTANT_NAME } from './config.js';
import { logger } from './logger.js';

export function escapeXml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format messages for the agent prompt
 */
export function formatMessages(messages: DbMessage[]): string {
  return messages.map(msg => {
    const date = new Date(msg.timestamp);
    const timeStr = date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    return `[${timeStr}] ${msg.senderName}: ${msg.text}`;
  }).join('\n');
}

/**
 * Check if a message should trigger the agent
 */
export function shouldTrigger(message: DbMessage): boolean {
  if (!message.text) return false;
  return TRIGGER_PATTERN.test(message.text.trim());
}

/**
 * Find the channel that owns a JID
 */
export function findChannelForJid(jid: string, channels: Channel[]): Channel | null {
  for (const channel of channels) {
    if (channel.ownsJid(jid)) {
      return channel;
    }
  }
  return null;
}

/**
 * Get the group folder for a JID
 */
export function getGroupFolderForJid(jid: string): string | null {
  const group = getRegisteredGroupByFolder(jid);
  return group?.folder || null;
}

/**
 * Build the prompt for the agent with conversation context
 */
export function buildAgentPrompt(
  messages: DbMessage[],
  group: RegisteredGroup
): string {
  const formattedMessages = formatMessages(messages);
  
  return `You are ${ASSISTANT_NAME}, a helpful AI assistant.

Conversation history:
${formattedMessages}

Please respond to the latest messages above. Be helpful, concise, and natural.`;
}

/**
 * Process incoming messages for a group
 */
export async function processGroupMessages(
  groupFolder: string,
  channels: Channel[]
): Promise<{ hasMessages: boolean; prompt?: string; channel?: Channel }> {
  try {
    const group = getRegisteredGroupByFolder(groupFolder);
    if (!group) {
      logger.warn(`Group not found: ${groupFolder}`);
      return { hasMessages: false };
    }

    // Get router state to find last processed message
    const state = getRouterState(groupFolder);
    const lastMessageId = state?.last_agent_message_id || 0;

    // Fetch messages since last agent interaction
    const messages = getMessagesSince(groupFolder, lastMessageId);
    
    if (messages.length === 0) {
      return { hasMessages: false };
    }

    // Check if any message triggers the agent
    const triggeringMessage = messages.find(shouldTrigger);
    if (!triggeringMessage) {
      // Mark messages as processed but don't trigger agent
      markMessagesProcessed(messages.map(m => m.id));
      return { hasMessages: false };
    }

    // Find the owning channel
    const channel = findChannelForJid(triggeringMessage.chatJid, channels);
    if (!channel) {
      logger.warn(`No channel found for JID: ${triggeringMessage.chatJid}`);
      return { hasMessages: false };
    }

    // Update router state to current message
    setRouterState(groupFolder, messages[messages.length - 1].id);
    
    // Mark messages as processed
    markMessagesProcessed(messages.map(m => m.id));

    // Build prompt with all messages (for context)
    const prompt = buildAgentPrompt(messages, group);

    logger.info(`Triggered agent for group: ${groupFolder}`);
    
    return {
      hasMessages: true,
      prompt,
      channel,
    };
  } catch (error) {
    logger.error(`Error processing messages for ${groupFolder}: ${error}`);
    return { hasMessages: false };
  }
}

/**
 * Send a message via the appropriate channel
 */
export async function sendMessage(
  jid: string,
  text: string,
  channels: Channel[]
): Promise<void> {
  const channel = findChannelForJid(jid, channels);
  if (!channel) {
    logger.warn(`Cannot send message: no channel for JID ${jid}`);
    return;
  }

  try {
    await channel.sendMessage(jid, text);
    logger.info(`Message sent to ${jid} via ${channel.name}`);
  } catch (error) {
    logger.error(`Failed to send message to ${jid}: ${error}`);
  }
}

/**
 * Prefix response with assistant name
 */
export function formatResponse(text: string): string {
  return `${ASSISTANT_NAME}: ${text}`;
}

export function routeOutbound(
  channels: Channel[],
  jid: string,
  text: string,
): Promise<void> {
  const channel = channels.find((c) => c.ownsJid(jid) && c.isConnected());
  if (!channel) throw new Error(`No channel for JID: ${jid}`);
  return channel.sendMessage(jid, text);
}
