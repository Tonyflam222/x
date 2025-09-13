export interface OpenChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: {
    type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'giphy' | 'custom';
    text?: string;
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    pollOptions?: string[];
    customData?: any;
  };
  timestamp: number;
  edited?: boolean;
  repliedTo?: string;
}

export interface OpenChatUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarId?: string;
  isBot: boolean;
}

export interface OpenChatChannel {
  chatId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  memberCount: number;
  lastActivity: number;
  permissions: {
    canSendMessages: boolean;
    canInviteUsers: boolean;
    canRemoveUsers: boolean;
    canDeleteMessages: boolean;
    canPinMessages: boolean;
  };
}

export interface OpenChatEvent {
  eventType: 'message' | 'member_joined' | 'member_left' | 'channel_created' | 'channel_deleted' | 'user_invited' | 'user_removed';
  chatId: string;
  timestamp: number;
  data: any;
}

export interface OpenChatBotConfig {
  botId: string;
  botName: string;
  apiEndpoint: string;
  webhookUrl?: string;
  apiKey?: string;
  principal?: string;
}

export interface SendMessageOptions {
  chatId: string;
  content: {
    type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'giphy' | 'custom';
    text?: string;
    url?: string;
    fileName?: string;
    fileData?: Buffer;
    mimeType?: string;
    pollOptions?: string[];
    customData?: any;
  };
  replyTo?: string;
  threadRootMessageIndex?: number;
}

export interface CreateChannelOptions {
  name: string;
  description?: string;
  isPublic: boolean;
  avatar?: Buffer;
  permissions?: {
    canSendMessages?: boolean;
    canInviteUsers?: boolean;
    canRemoveUsers?: boolean;
    canDeleteMessages?: boolean;
    canPinMessages?: boolean;
  };
}

export interface InviteMembersOptions {
  chatId: string;
  userIds: string[];
}

export interface RemoveMembersOptions {
  chatId: string;
  userIds: string[];
}

export interface OpenChatResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  messageId?: string;
}