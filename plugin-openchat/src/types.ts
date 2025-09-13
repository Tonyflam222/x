import { Principal } from '@dfinity/principal';

// OpenChat message types
export interface OpenChatMessage {
  messageId: bigint;
  messageIndex: number;
  sender: Principal;
  content: MessageContent;
  timestamp: bigint;
  edited?: boolean;
  forwarded?: boolean;
  repliesTo?: {
    messageIndex: number;
  };
}

export interface MessageContent {
  Text?: { text: string };
  Image?: { url: string; caption?: string };
  Video?: { url: string; caption?: string };
  Audio?: { url: string; caption?: string };
  File?: { url: string; name: string; fileSize: number };
  Poll?: { question: string; options: string[] };
  Crypto?: { amount: bigint; token: string; recipient: Principal };
  Deleted?: { timestamp: bigint };
  Custom?: { data: Uint8Array };
}

// OpenChat chat types
export interface ChatSummary {
  chatId: Principal;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
  lastMessage?: OpenChatMessage;
  permissions: ChatPermissions;
  avatarUrl?: string;
}

export interface ChatPermissions {
  canSendMessages: boolean;
  canEditMessages: boolean;
  canDeleteMessages: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canChangePermissions: boolean;
  canPinMessages: boolean;
}

// Direct chat types
export interface DirectChatSummary {
  chatId: Principal;
  userId: Principal;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  lastMessage?: OpenChatMessage;
  unreadCount: number;
}

// User types
export interface User {
  userId: Principal;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isBot: boolean;
  isPremium: boolean;
  suspended?: boolean;
}

// Event types for real-time updates
export interface OpenChatEvent {
  type: 'message' | 'message_edited' | 'message_deleted' | 'user_joined' | 'user_left' | 'chat_updated';
  chatId: Principal;
  userId?: Principal;
  messageIndex?: number;
  timestamp: bigint;
  data: any;
}

// Plugin configuration
export interface OpenChatConfig {
  // Internet Computer network (local, testnet, mainnet)
  network: 'local' | 'testnet' | 'mainnet';
  
  // Bot identity configuration
  identity?: {
    privateKey?: string;
    seedPhrase?: string;
    pemFile?: string;
  };
  
  // OpenChat canister IDs
  canisterIds: {
    userIndex: string;
    groupIndex: string;
    notifications: string;
    onlineUsers: string;
    proposals: string;
    registry: string;
    internetIdentity: string;
  };
  
  // Bot settings
  botSettings: {
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    autoJoinPublicGroups?: boolean;
    respondToDirectMessages?: boolean;
    respondToGroupMentions?: boolean;
    maxMessageLength?: number;
  };
  
  // Rate limiting
  rateLimits?: {
    messagesPerMinute?: number;
    messagesPerHour?: number;
    maxConcurrentChats?: number;
  };
  
  // Webhook settings for real-time updates
  webhook?: {
    url: string;
    secret?: string;
    events?: string[];
  };
}

// API response types
export interface SendMessageResponse {
  success: boolean;
  messageId?: bigint;
  messageIndex?: number;
  timestamp?: bigint;
  error?: string;
}

export interface GetMessagesResponse {
  messages: OpenChatMessage[];
  latestEventIndex: number;
  hasMore: boolean;
}

export interface SearchUsersResponse {
  users: User[];
  hasMore: boolean;
}

export interface JoinChatResponse {
  success: boolean;
  error?: string;
}

// Error types
export class OpenChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenChatError';
  }
}

// Utility types
export type MessageFilter = {
  fromUser?: Principal;
  messageType?: keyof MessageContent;
  timeRange?: {
    from: bigint;
    to: bigint;
  };
  containsText?: string;
};

export type ChatType = 'direct' | 'group' | 'channel';