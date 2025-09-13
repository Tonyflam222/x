import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import fetch from 'node-fetch';
import {
  OpenChatConfig,
  OpenChatMessage,
  MessageContent,
  ChatSummary,
  DirectChatSummary,
  User,
  SendMessageResponse,
  GetMessagesResponse,
  SearchUsersResponse,
  JoinChatResponse,
  OpenChatError,
  MessageFilter,
  ChatType
} from './types';

// Candid interface definitions for OpenChat
const userIndexIDL = IDL.Service({
  'current_user': IDL.Func([], [IDL.Opt(IDL.Record({
    'user_id': IDL.Principal,
    'username': IDL.Text,
    'display_name': IDL.Opt(IDL.Text),
    'avatar_url': IDL.Opt(IDL.Text),
    'bio': IDL.Opt(IDL.Text),
    'is_bot': IDL.Bool,
    'is_premium': IDL.Bool,
    'suspended': IDL.Bool,
  }))], ['query']),
  'search_users': IDL.Func([IDL.Text, IDL.Nat32], [IDL.Vec(IDL.Record({
    'user_id': IDL.Principal,
    'username': IDL.Text,
    'display_name': IDL.Opt(IDL.Text),
    'avatar_url': IDL.Opt(IDL.Text),
    'bio': IDL.Opt(IDL.Text),
    'is_bot': IDL.Bool,
    'is_premium': IDL.Bool,
  }))], ['query']),
});

const groupIndexIDL = IDL.Service({
  'search_groups': IDL.Func([IDL.Text, IDL.Nat32], [IDL.Vec(IDL.Record({
    'chat_id': IDL.Principal,
    'name': IDL.Text,
    'description': IDL.Text,
    'is_public': IDL.Bool,
    'member_count': IDL.Nat32,
    'avatar_url': IDL.Opt(IDL.Text),
  }))], ['query']),
});

export class OpenChatClient {
  private agent: HttpAgent;
  private config: OpenChatConfig;
  private userIndexActor: any;
  private groupIndexActor: any;
  private chatActors: Map<string, any> = new Map();

  constructor(config: OpenChatConfig) {
    this.config = config;
    this.initializeAgent();
  }

  private async initializeAgent(): Promise<void> {
    try {
      // Determine the IC network host
      const host = this.getNetworkHost();
      
      this.agent = new HttpAgent({
        host,
        fetch: fetch as any,
      });

      // Only fetch root key for local development
      if (this.config.network === 'local') {
        await this.agent.fetchRootKey();
      }

      // Initialize canister actors
      this.userIndexActor = Actor.createActor(userIndexIDL, {
        agent: this.agent,
        canisterId: this.config.canisterIds.userIndex,
      });

      this.groupIndexActor = Actor.createActor(groupIndexIDL, {
        agent: this.agent,
        canisterId: this.config.canisterIds.groupIndex,
      });

    } catch (error) {
      throw new OpenChatError(
        'Failed to initialize OpenChat client',
        'INITIALIZATION_ERROR',
        error
      );
    }
  }

  private getNetworkHost(): string {
    switch (this.config.network) {
      case 'local':
        return 'http://localhost:4943';
      case 'testnet':
        return 'https://ic0.app';
      case 'mainnet':
        return 'https://ic0.app';
      default:
        return 'https://ic0.app';
    }
  }

  // User management methods
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.userIndexActor.current_user();
      if (response && response.length > 0) {
        const userData = response[0];
        return {
          userId: userData.user_id,
          username: userData.username,
          displayName: userData.display_name?.[0],
          avatarUrl: userData.avatar_url?.[0],
          bio: userData.bio?.[0],
          isBot: userData.is_bot,
          isPremium: userData.is_premium,
          suspended: userData.suspended,
        };
      }
      return null;
    } catch (error) {
      throw new OpenChatError(
        'Failed to get current user',
        'GET_USER_ERROR',
        error
      );
    }
  }

  async searchUsers(query: string, limit: number = 20): Promise<SearchUsersResponse> {
    try {
      const users = await this.userIndexActor.search_users(query, limit);
      return {
        users: users.map((user: any) => ({
          userId: user.user_id,
          username: user.username,
          displayName: user.display_name?.[0],
          avatarUrl: user.avatar_url?.[0],
          bio: user.bio?.[0],
          isBot: user.is_bot,
          isPremium: user.is_premium,
          suspended: false,
        })),
        hasMore: users.length === limit,
      };
    } catch (error) {
      throw new OpenChatError(
        'Failed to search users',
        'SEARCH_USERS_ERROR',
        error
      );
    }
  }

  // Chat management methods
  async getDirectChats(): Promise<DirectChatSummary[]> {
    try {
      // This would typically call a method to get direct chats
      // For now, returning empty array as this requires more specific canister methods
      return [];
    } catch (error) {
      throw new OpenChatError(
        'Failed to get direct chats',
        'GET_DIRECT_CHATS_ERROR',
        error
      );
    }
  }

  async getGroupChats(): Promise<ChatSummary[]> {
    try {
      // This would typically call a method to get group chats the user is a member of
      return [];
    } catch (error) {
      throw new OpenChatError(
        'Failed to get group chats',
        'GET_GROUP_CHATS_ERROR',
        error
      );
    }
  }

  async searchGroups(query: string, limit: number = 20): Promise<ChatSummary[]> {
    try {
      const groups = await this.groupIndexActor.search_groups(query, limit);
      return groups.map((group: any) => ({
        chatId: group.chat_id,
        name: group.name,
        description: group.description,
        isPublic: group.is_public,
        memberCount: Number(group.member_count),
        avatarUrl: group.avatar_url?.[0],
        permissions: {
          canSendMessages: true,
          canEditMessages: false,
          canDeleteMessages: false,
          canAddMembers: false,
          canRemoveMembers: false,
          canChangePermissions: false,
          canPinMessages: false,
        },
      }));
    } catch (error) {
      throw new OpenChatError(
        'Failed to search groups',
        'SEARCH_GROUPS_ERROR',
        error
      );
    }
  }

  // Message methods
  async sendMessage(
    chatId: Principal,
    content: string,
    chatType: ChatType = 'direct',
    replyToMessageIndex?: number
  ): Promise<SendMessageResponse> {
    try {
      // Get or create chat actor
      const chatActor = await this.getChatActor(chatId, chatType);
      
      const messageContent: MessageContent = {
        Text: { text: content }
      };

      const sendArgs: any = {
        content: messageContent,
        message_id: BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000)),
        replies_to: replyToMessageIndex ? { message_index: replyToMessageIndex } : undefined,
        forwarded: false,
      };

      const response = await chatActor.send_message(sendArgs);
      
      if (response.Success) {
        return {
          success: true,
          messageId: response.Success.message_id,
          messageIndex: response.Success.message_index,
          timestamp: response.Success.timestamp,
        };
      } else {
        return {
          success: false,
          error: response.Error || 'Unknown error occurred',
        };
      }
    } catch (error) {
      throw new OpenChatError(
        'Failed to send message',
        'SEND_MESSAGE_ERROR',
        error
      );
    }
  }

  async getMessages(
    chatId: Principal,
    chatType: ChatType = 'direct',
    startIndex?: number,
    ascending: boolean = true,
    maxMessages: number = 50
  ): Promise<GetMessagesResponse> {
    try {
      const chatActor = await this.getChatActor(chatId, chatType);
      
      const response = await chatActor.messages({
        start_index: startIndex || 0,
        ascending,
        max_messages: maxMessages,
      });

      return {
        messages: response.messages.map(this.parseMessage),
        latestEventIndex: response.latest_event_index,
        hasMore: response.messages.length === maxMessages,
      };
    } catch (error) {
      throw new OpenChatError(
        'Failed to get messages',
        'GET_MESSAGES_ERROR',
        error
      );
    }
  }

  async editMessage(
    chatId: Principal,
    messageIndex: number,
    newContent: string,
    chatType: ChatType = 'direct'
  ): Promise<boolean> {
    try {
      const chatActor = await this.getChatActor(chatId, chatType);
      
      const response = await chatActor.edit_message({
        message_index: messageIndex,
        content: { Text: { text: newContent } },
      });

      return response.Success !== undefined;
    } catch (error) {
      throw new OpenChatError(
        'Failed to edit message',
        'EDIT_MESSAGE_ERROR',
        error
      );
    }
  }

  async deleteMessage(
    chatId: Principal,
    messageIndex: number,
    chatType: ChatType = 'direct'
  ): Promise<boolean> {
    try {
      const chatActor = await this.getChatActor(chatId, chatType);
      
      const response = await chatActor.delete_message({
        message_index: messageIndex,
      });

      return response.Success !== undefined;
    } catch (error) {
      throw new OpenChatError(
        'Failed to delete message',
        'DELETE_MESSAGE_ERROR',
        error
      );
    }
  }

  // Chat joining/leaving
  async joinGroup(chatId: Principal): Promise<JoinChatResponse> {
    try {
      const chatActor = await this.getChatActor(chatId, 'group');
      
      const response = await chatActor.join_group({});
      
      if (response.Success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.Error || 'Failed to join group',
        };
      }
    } catch (error) {
      throw new OpenChatError(
        'Failed to join group',
        'JOIN_GROUP_ERROR',
        error
      );
    }
  }

  async leaveGroup(chatId: Principal): Promise<boolean> {
    try {
      const chatActor = await this.getChatActor(chatId, 'group');
      
      const response = await chatActor.leave_group({});
      return response.Success !== undefined;
    } catch (error) {
      throw new OpenChatError(
        'Failed to leave group',
        'LEAVE_GROUP_ERROR',
        error
      );
    }
  }

  // Utility methods
  private async getChatActor(chatId: Principal, chatType: ChatType): Promise<any> {
    const chatIdString = chatId.toString();
    
    if (this.chatActors.has(chatIdString)) {
      return this.chatActors.get(chatIdString);
    }

    // Create appropriate IDL based on chat type
    const chatIDL = this.getChatIDL(chatType);
    
    const chatActor = Actor.createActor(chatIDL, {
      agent: this.agent,
      canisterId: chatId,
    });

    this.chatActors.set(chatIdString, chatActor);
    return chatActor;
  }

  private getChatIDL(chatType: ChatType): any {
    // This would return the appropriate Candid interface for the chat type
    // For now, returning a basic interface
    return IDL.Service({
      'send_message': IDL.Func([IDL.Record({
        'content': IDL.Variant({
          'Text': IDL.Record({ 'text': IDL.Text }),
          'Image': IDL.Record({ 'url': IDL.Text, 'caption': IDL.Opt(IDL.Text) }),
        }),
        'message_id': IDL.Nat64,
        'replies_to': IDL.Opt(IDL.Record({ 'message_index': IDL.Nat32 })),
        'forwarded': IDL.Bool,
      })], [IDL.Variant({
        'Success': IDL.Record({
          'message_id': IDL.Nat64,
          'message_index': IDL.Nat32,
          'timestamp': IDL.Nat64,
        }),
        'Error': IDL.Text,
      })], []),
      'messages': IDL.Func([IDL.Record({
        'start_index': IDL.Nat32,
        'ascending': IDL.Bool,
        'max_messages': IDL.Nat32,
      })], [IDL.Record({
        'messages': IDL.Vec(IDL.Record({
          'message_id': IDL.Nat64,
          'message_index': IDL.Nat32,
          'sender': IDL.Principal,
          'content': IDL.Variant({
            'Text': IDL.Record({ 'text': IDL.Text }),
          }),
          'timestamp': IDL.Nat64,
        })),
        'latest_event_index': IDL.Nat32,
      })], ['query']),
    });
  }

  private parseMessage(rawMessage: any): OpenChatMessage {
    return {
      messageId: rawMessage.message_id,
      messageIndex: rawMessage.message_index,
      sender: rawMessage.sender,
      content: rawMessage.content,
      timestamp: rawMessage.timestamp,
      edited: rawMessage.edited,
      forwarded: rawMessage.forwarded,
      repliesTo: rawMessage.replies_to ? {
        messageIndex: rawMessage.replies_to.message_index,
      } : undefined,
    };
  }

  // Real-time event polling (simplified version)
  async pollForEvents(chatId: Principal, lastEventIndex: number = 0): Promise<any[]> {
    try {
      const chatActor = await this.getChatActor(chatId, 'direct');
      
      const response = await chatActor.events({
        start_index: lastEventIndex,
        ascending: true,
        max_events: 100,
      });

      return response.events || [];
    } catch (error) {
      console.error('Error polling for events:', error);
      return [];
    }
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    this.chatActors.clear();
  }
}