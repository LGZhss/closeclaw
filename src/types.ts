/**
 * Channel interface - all communication channels must implement this
 */
export interface Channel {
  name: string;
  connect(): Promise<void>;
  sendMessage(jid: string, text: string): Promise<void>;
  isConnected(): boolean;
  ownsJid(jid: string): boolean;
  disconnect(): Promise<void>;
  setTyping?(jid: string, isTyping: boolean): Promise<void>;
  syncGroups?(force: boolean): Promise<void>;
}

/**
 * Channel factory function type
 */
export type ChannelFactory = (opts: ChannelOpts) => Channel | null;

/**
 * Channel initialization options
 */
export interface ChannelOpts {
  onMessage: (message: IncomingMessage) => Promise<void>;
  onChatMetadata?: (metadata: ChatMetadata) => void;
  registeredGroups: (groups: RegisteredGroup[]) => void;
}

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

/**
 * Outgoing message structure
 */
export interface OutgoingMessage {
  channel: string;
  jid: string;
  text: string;
}

/**
 * Chat metadata
 */
export interface ChatMetadata {
  jid: string;
  name: string;
  isGroup: boolean;
}

/**
 * Registered group structure
 */
export interface RegisteredGroup {
  jid: string;
  name: string;
  folder: string;
  channel: string;
  trigger?: string;
  isMain?: boolean;
  added_at: string;
  containerConfig?: ContainerConfig;
}

/**
 * Container configuration for additional mounts
 */
export interface ContainerConfig {
  additionalMounts?: MountConfig[];
  timeout?: number;
}

/**
 * Mount configuration
 */
export interface MountConfig {
  hostPath: string;
  containerPath: string;
  readonly?: boolean;
}

/**
 * Scheduled task structure
 */
export interface ScheduledTask {
  id: number;
  group_folder: string;
  prompt: string;
  schedule_type: "cron" | "interval" | "once";
  schedule_value: string;
  is_paused: boolean;
  created_at: string;
  last_run_at?: string;
  next_run_at?: string;
}

/**
 * Task run log
 */
export interface TaskRunLog {
  id: number;
  task_id: number;
  started_at: string;
  completed_at?: string;
  result?: string;
  error?: string;
}

/**
 * Session structure
 */
export interface Session {
  group_folder: string;
  session_id: string;
  updated_at: string;
}

/**
 * Router state
 */
export interface RouterState {
  group_folder: string;
  last_agent_message_id: number;
}

/**
 * Database message structure
 */
export interface DbMessage {
  id: number;
  channel: string;
  chat_jid: string;
  sender_jid: string;
  sender_name: string;
  text: string;
  timestamp: number;
  is_group: boolean;
  group_name?: string;
  processed: boolean;
  created_at: string;
}
