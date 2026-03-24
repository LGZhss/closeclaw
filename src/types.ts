/**
 * Incoming message structure
 */
export interface IncomingMessage {
  id: string;
  channel: string;
  chatJid: string;
  senderJid: string;
  senderName: string;
  text: string;
  timestamp: number;
  isGroup: boolean;
  groupName?: string;
}
