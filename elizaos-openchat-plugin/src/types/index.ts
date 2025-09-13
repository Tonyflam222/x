import { UUID } from "@elizaos/core";

export interface OpenChatConfig {
    canisterId: string;
    identity?: string;
    host?: string;
    fetchRootKey?: boolean;
}

export interface OpenChatMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: number;
    messageType: MessageType;
    chatId: string;
    threadRootMessageIndex?: number;
    repliesTo?: ReplyContext;
    reactions?: Reaction[];
    edited?: boolean;
    forwarded?: boolean;
}

export interface OpenChatUser {
    userId: string;
    username: string;
    displayName?: string;
    avatarId?: number;
    isPremium: boolean;
    suspended: boolean;
}

export interface OpenChatChannel {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    memberCount: number;
    permissions: ChannelPermissions;
    avatar?: string;
}

export interface OpenChatGroup {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    memberCount: number;
    permissions: GroupPermissions;
    avatar?: string;
}

export interface ChannelPermissions {
    changeRoles: string[];
    updateGroup: string[];
    inviteUsers: string[];
    removeMembers: string[];
    deleteMessages: string[];
    pinMessages: string[];
    reactToMessages: string[];
    mentionAllMembers: string[];
}

export interface GroupPermissions {
    changeRoles: string[];
    updateGroup: string[];
    inviteUsers: string[];
    removeMembers: string[];
    deleteMessages: string[];
    pinMessages: string[];
    reactToMessages: string[];
    mentionAllMembers: string[];
}

export interface ReplyContext {
    messageId: string;
    messageIndex: number;
}

export interface Reaction {
    reaction: string;
    userIds: string[];
}

export enum MessageType {
    Text = "text",
    Image = "image",
    Video = "video",
    Audio = "audio",
    File = "file",
    Poll = "poll",
    Crypto = "crypto",
    Deleted = "deleted",
    Giphy = "giphy",
    GovernanceProposal = "governance_proposal",
    Prize = "prize",
    PrizeWinner = "prize_winner",
    MessageReminderCreated = "message_reminder_created",
    MessageReminder = "message_reminder",
    ReportedMessage = "reported_message",
    P2PSwap = "p2p_swap",
    VideoCall = "video_call",
    Custom = "custom"
}

export interface OpenChatEvent {
    type: 'message' | 'reaction' | 'member_joined' | 'member_left' | 'group_created' | 'channel_created';
    data: any;
    timestamp: number;
    chatId: string;
}

export interface SendMessageRequest {
    chatId: string;
    content: string;
    messageType?: MessageType;
    repliesTo?: ReplyContext;
    threadRootMessageIndex?: number;
    forwardingMessages?: string[];
}

export interface SendMessageResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface OpenChatMemory {
    userId: UUID;
    chatId: string;
    messages: OpenChatMessage[];
    lastMessageTimestamp: number;
}

export interface OpenChatClient {
    sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;
    getMessages(chatId: string, fromIndex?: number, limit?: number): Promise<OpenChatMessage[]>;
    getUser(userId: string): Promise<OpenChatUser | null>;
    getChannel(channelId: string): Promise<OpenChatChannel | null>;
    getGroup(groupId: string): Promise<OpenChatGroup | null>;
    joinGroup(groupId: string): Promise<boolean>;
    leaveGroup(groupId: string): Promise<boolean>;
    addReaction(chatId: string, messageId: string, reaction: string): Promise<boolean>;
    removeReaction(chatId: string, messageId: string, reaction: string): Promise<boolean>;
    deleteMessage(chatId: string, messageId: string): Promise<boolean>;
    editMessage(chatId: string, messageId: string, newContent: string): Promise<boolean>;
    markAsRead(chatId: string, messageId: string): Promise<boolean>;
    startTyping(chatId: string): Promise<void>;
    stopTyping(chatId: string): Promise<void>;
}