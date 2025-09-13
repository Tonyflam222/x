import { Principal } from '@dfinity/principal';

export interface OpenChatConfig {
  canisterId: string;
  identityProvider?: string;
  userPrincipal?: string;
  privateKey?: string;
  environment?: 'local' | 'ic';
  host?: string;
}

export interface OpenChatMessage {
  messageId: bigint;
  sender: Principal;
  content: MessageContent;
  timestamp: bigint;
  threadRootMessageIndex?: number;
  forwarded?: boolean;
  edited?: boolean;
}

export interface MessageContent {
  text?: string;
  image?: {
    blobReference: BlobReference;
    thumbnailData: string;
    caption?: string;
  };
  video?: {
    blobReference: BlobReference;
    thumbnailData: string;
    caption?: string;
  };
  audio?: {
    blobReference: BlobReference;
    caption?: string;
  };
  file?: {
    blobReference: BlobReference;
    name: string;
    mimeType: string;
    caption?: string;
  };
  poll?: {
    question: string;
    options: string[];
    endDate?: bigint;
    anonymous: boolean;
    allowMultipleVotes: boolean;
  };
  crypto?: {
    recipient: Principal;
    transfer: CryptoTransfer;
    caption?: string;
  };
  deleted?: {
    deletedBy: Principal;
    timestamp: bigint;
  };
}

export interface BlobReference {
  canisterId: Principal;
  blobId: bigint;
}

export interface CryptoTransfer {
  token: string;
  amount: bigint;
  fee: bigint;
  memo?: bigint;
}

export interface OpenChatUser {
  userId: Principal;
  username: string;
  displayName?: string;
  avatarId?: bigint;
  bio?: string;
  isPremium: boolean;
  suspended: boolean;
}

export interface OpenChatGroup {
  chatId: Principal;
  name: string;
  description: string;
  isPublic: boolean;
  historyVisible: boolean;
  minVisibleEventIndex: number;
  minVisibleMessageIndex: number;
  latestMessage?: OpenChatMessage;
  memberCount: number;
  permissions: GroupPermissions;
  eventsTTL?: bigint;
  gate?: AccessGate;
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

export interface AccessGate {
  diamondMember?: boolean;
  lifetimeDiamondMember?: boolean;
  uniquePerson?: boolean;
  verifiedCredential?: {
    issuerCanisterId: Principal;
    issuerOrigin: string;
    credentialType: string;
    credentialArguments: Record<string, string>;
  };
  tokenBalance?: {
    ledgerCanisterId: Principal;
    minBalance: bigint;
  };
  composite?: {
    and?: AccessGate[];
    or?: AccessGate[];
  };
}

export interface OpenChatChannel {
  channelId: bigint;
  name: string;
  description: string;
  isPublic: boolean;
  historyVisible: boolean;
  minVisibleEventIndex: number;
  minVisibleMessageIndex: number;
  latestMessage?: OpenChatMessage;
  memberCount: number;
  permissions: GroupPermissions;
  eventsTTL?: bigint;
  gate?: AccessGate;
}

export interface SendMessageArgs {
  chatId: Principal;
  threadRootMessageIndex?: number;
  messageId: bigint;
  content: MessageContent;
  replyingTo?: {
    eventIndex: number;
  };
  forwardingMessages?: {
    chatId: Principal;
    messageIds: bigint[];
  };
  correlationId: bigint;
}

export interface SendMessageResponse {
  messageIndex: number;
  eventIndex: number;
  timestamp: bigint;
  expiresAt?: bigint;
}

export interface OpenChatEvent {
  type: 'message' | 'member_joined' | 'member_left' | 'group_created' | 'group_updated' | 'reaction_added' | 'reaction_removed';
  chatId: Principal;
  userId?: Principal;
  messageId?: bigint;
  content?: any;
  timestamp: bigint;
}

export interface OpenChatClient {
  sendMessage(args: SendMessageArgs): Promise<SendMessageResponse>;
  getMessages(chatId: Principal, fromIndex?: number, ascending?: boolean, maxResults?: number): Promise<OpenChatMessage[]>;
  joinGroup(chatId: Principal): Promise<boolean>;
  leaveGroup(chatId: Principal): Promise<boolean>;
  createGroup(name: string, description: string, isPublic: boolean): Promise<Principal>;
  getUser(userId: Principal): Promise<OpenChatUser>;
  getCurrentUser(): Promise<OpenChatUser>;
  searchUsers(term: string): Promise<OpenChatUser[]>;
  getPublicGroups(): Promise<OpenChatGroup[]>;
  getUserGroups(): Promise<OpenChatGroup[]>;
  addReaction(chatId: Principal, messageId: bigint, reaction: string): Promise<boolean>;
  removeReaction(chatId: Principal, messageId: bigint, reaction: string): Promise<boolean>;
  deleteMessage(chatId: Principal, messageId: bigint): Promise<boolean>;
  editMessage(chatId: Principal, messageId: bigint, content: MessageContent): Promise<boolean>;
  blockUser(userId: Principal): Promise<boolean>;
  unblockUser(userId: Principal): Promise<boolean>;
  subscribeToEvents(callback: (event: OpenChatEvent) => void): Promise<void>;
  unsubscribeFromEvents(): Promise<void>;
}