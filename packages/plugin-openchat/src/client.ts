import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import {
  OpenChatConfig,
  OpenChatClient as IOpenChatClient,
  OpenChatMessage,
  OpenChatUser,
  OpenChatGroup,
  OpenChatEvent,
  SendMessageArgs,
  SendMessageResponse,
  MessageContent
} from './types.js';

// OpenChat canister interface (simplified)
const openChatIdl = ({ IDL }: any) => {
  const Principal = IDL.Principal;
  const MessageContent = IDL.Variant({
    'text': IDL.Record({ 'text': IDL.Text }),
    'image': IDL.Record({
      'blob_reference': IDL.Record({
        'canister_id': Principal,
        'blob_id': IDL.Nat
      }),
      'thumbnail_data': IDL.Text,
      'caption': IDL.Opt(IDL.Text)
    }),
    'video': IDL.Record({
      'blob_reference': IDL.Record({
        'canister_id': Principal,
        'blob_id': IDL.Nat
      }),
      'thumbnail_data': IDL.Text,
      'caption': IDL.Opt(IDL.Text)
    }),
    'audio': IDL.Record({
      'blob_reference': IDL.Record({
        'canister_id': Principal,
        'blob_id': IDL.Nat
      }),
      'caption': IDL.Opt(IDL.Text)
    }),
    'file': IDL.Record({
      'blob_reference': IDL.Record({
        'canister_id': Principal,
        'blob_id': IDL.Nat
      }),
      'name': IDL.Text,
      'mime_type': IDL.Text,
      'caption': IDL.Opt(IDL.Text)
    })
  });

  const SendMessageArgs = IDL.Record({
    'chat_id': Principal,
    'thread_root_message_index': IDL.Opt(IDL.Nat32),
    'message_id': IDL.Nat,
    'content': MessageContent,
    'replying_to': IDL.Opt(IDL.Record({ 'event_index': IDL.Nat32 })),
    'correlation_id': IDL.Nat64
  });

  const SendMessageResponse = IDL.Variant({
    'success': IDL.Record({
      'message_index': IDL.Nat32,
      'event_index': IDL.Nat32,
      'timestamp': IDL.Nat64,
      'expires_at': IDL.Opt(IDL.Nat64)
    }),
    'message_empty': IDL.Null,
    'text_too_long': IDL.Nat32,
    'invalid_request': IDL.Text,
    'thread_message_not_found': IDL.Null,
    'not_authorized': IDL.Null,
    'user_suspended': IDL.Null,
    'chat_frozen': IDL.Null
  });

  return IDL.Service({
    'send_message_v2': IDL.Func([SendMessageArgs], [SendMessageResponse], []),
    'messages': IDL.Func([IDL.Record({
      'chat_id': Principal,
      'max_results': IDL.Nat8,
      'start_index': IDL.Opt(IDL.Nat32),
      'ascending': IDL.Bool
    })], [IDL.Variant({
      'success': IDL.Record({
        'messages': IDL.Vec(IDL.Record({
          'message_id': IDL.Nat,
          'sender': Principal,
          'content': MessageContent,
          'timestamp': IDL.Nat64,
          'thread_root_message_index': IDL.Opt(IDL.Nat32),
          'forwarded': IDL.Bool,
          'edited': IDL.Bool
        }))
      }),
      'chat_not_found': IDL.Null,
      'not_authorized': IDL.Null
    })], ['query']),
    'join_group': IDL.Func([IDL.Record({ 'chat_id': Principal })], [IDL.Variant({
      'success': IDL.Null,
      'already_in_group': IDL.Null,
      'group_not_found': IDL.Null,
      'group_not_public': IDL.Null,
      'blocked': IDL.Null,
      'user_suspended': IDL.Null
    })], []),
    'leave_group': IDL.Func([IDL.Record({ 'chat_id': Principal })], [IDL.Variant({
      'success': IDL.Null,
      'caller_not_in_group': IDL.Null,
      'group_not_found': IDL.Null,
      'owner_cannot_leave': IDL.Null
    })], []),
    'public_groups': IDL.Func([], [IDL.Vec(IDL.Record({
      'chat_id': Principal,
      'name': IDL.Text,
      'description': IDL.Text,
      'is_public': IDL.Bool,
      'member_count': IDL.Nat32
    }))], ['query']),
    'current_user': IDL.Func([], [IDL.Opt(IDL.Record({
      'user_id': Principal,
      'username': IDL.Text,
      'display_name': IDL.Opt(IDL.Text),
      'avatar_id': IDL.Opt(IDL.Nat),
      'bio': IDL.Opt(IDL.Text),
      'is_premium': IDL.Bool,
      'suspended': IDL.Bool
    }))], ['query'])
  });
};

export class OpenChatClient implements IOpenChatClient {
  private agent: HttpAgent;
  private actor: any;
  private identity: Identity;
  private config: OpenChatConfig;
  private eventSubscribers: ((event: OpenChatEvent) => void)[] = [];
  private wsConnection?: WebSocket;

  constructor(config: OpenChatConfig) {
    this.config = config;
    this.initialize();
  }

  private async initialize() {
    const host = this.config.host || (this.config.environment === 'local' ? 'http://localhost:8080' : 'https://ic0.app');
    
    // Initialize identity
    if (this.config.privateKey) {
      const keyPair = Ed25519KeyIdentity.fromSecretKey(Buffer.from(this.config.privateKey, 'hex'));
      this.identity = keyPair;
    } else {
      const authClient = await AuthClient.create();
      this.identity = authClient.getIdentity();
    }

    // Create agent
    this.agent = new HttpAgent({
      host,
      identity: this.identity
    });

    if (this.config.environment === 'local') {
      await this.agent.fetchRootKey();
    }

    // Create actor
    this.actor = Actor.createActor(openChatIdl, {
      agent: this.agent,
      canisterId: this.config.canisterId
    });
  }

  async sendMessage(args: SendMessageArgs): Promise<SendMessageResponse> {
    try {
      const response = await this.actor.send_message_v2({
        chat_id: args.chatId,
        thread_root_message_index: args.threadRootMessageIndex ? [args.threadRootMessageIndex] : [],
        message_id: args.messageId,
        content: this.convertMessageContent(args.content),
        replying_to: args.replyingTo ? [{ event_index: args.replyingTo.eventIndex }] : [],
        correlation_id: args.correlationId
      });

      if ('success' in response) {
        return {
          messageIndex: response.success.message_index,
          eventIndex: response.success.event_index,
          timestamp: response.success.timestamp,
          expiresAt: response.success.expires_at?.[0]
        };
      } else {
        throw new Error(`Failed to send message: ${Object.keys(response)[0]}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(chatId: Principal, fromIndex?: number, ascending: boolean = true, maxResults: number = 50): Promise<OpenChatMessage[]> {
    try {
      const response = await this.actor.messages({
        chat_id: chatId,
        max_results: Math.min(maxResults, 100),
        start_index: fromIndex ? [fromIndex] : [],
        ascending
      });

      if ('success' in response) {
        return response.success.messages.map((msg: any) => ({
          messageId: msg.message_id,
          sender: msg.sender,
          content: this.parseMessageContent(msg.content),
          timestamp: msg.timestamp,
          threadRootMessageIndex: msg.thread_root_message_index?.[0],
          forwarded: msg.forwarded,
          edited: msg.edited
        }));
      } else {
        throw new Error(`Failed to get messages: ${Object.keys(response)[0]}`);
      }
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async joinGroup(chatId: Principal): Promise<boolean> {
    try {
      const response = await this.actor.join_group({ chat_id: chatId });
      return 'success' in response;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  }

  async leaveGroup(chatId: Principal): Promise<boolean> {
    try {
      const response = await this.actor.leave_group({ chat_id: chatId });
      return 'success' in response;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  }

  async createGroup(name: string, description: string, isPublic: boolean): Promise<Principal> {
    // This would need to be implemented based on OpenChat's group creation API
    throw new Error('Group creation not implemented yet');
  }

  async getUser(userId: Principal): Promise<OpenChatUser> {
    // This would need to be implemented based on OpenChat's user info API
    throw new Error('Get user not implemented yet');
  }

  async getCurrentUser(): Promise<OpenChatUser> {
    try {
      const response = await this.actor.current_user();
      if (response?.[0]) {
        const user = response[0];
        return {
          userId: user.user_id,
          username: user.username,
          displayName: user.display_name?.[0],
          avatarId: user.avatar_id?.[0],
          bio: user.bio?.[0],
          isPremium: user.is_premium,
          suspended: user.suspended
        };
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async searchUsers(term: string): Promise<OpenChatUser[]> {
    // This would need to be implemented based on OpenChat's user search API
    throw new Error('User search not implemented yet');
  }

  async getPublicGroups(): Promise<OpenChatGroup[]> {
    try {
      const groups = await this.actor.public_groups();
      return groups.map((group: any) => ({
        chatId: group.chat_id,
        name: group.name,
        description: group.description,
        isPublic: group.is_public,
        historyVisible: true,
        minVisibleEventIndex: 0,
        minVisibleMessageIndex: 0,
        memberCount: group.member_count,
        permissions: {
          changeRoles: [],
          updateGroup: [],
          inviteUsers: [],
          removeMembers: [],
          deleteMessages: [],
          pinMessages: [],
          reactToMessages: [],
          mentionAllMembers: []
        }
      }));
    } catch (error) {
      console.error('Error getting public groups:', error);
      throw error;
    }
  }

  async getUserGroups(): Promise<OpenChatGroup[]> {
    // This would need to be implemented based on OpenChat's user groups API
    throw new Error('Get user groups not implemented yet');
  }

  async addReaction(chatId: Principal, messageId: bigint, reaction: string): Promise<boolean> {
    // This would need to be implemented based on OpenChat's reaction API
    throw new Error('Add reaction not implemented yet');
  }

  async removeReaction(chatId: Principal, messageId: bigint, reaction: string): Promise<boolean> {
    // This would need to be implemented based on OpenChat's reaction API
    throw new Error('Remove reaction not implemented yet');
  }

  async deleteMessage(chatId: Principal, messageId: bigint): Promise<boolean> {
    // This would need to be implemented based on OpenChat's delete message API
    throw new Error('Delete message not implemented yet');
  }

  async editMessage(chatId: Principal, messageId: bigint, content: MessageContent): Promise<boolean> {
    // This would need to be implemented based on OpenChat's edit message API
    throw new Error('Edit message not implemented yet');
  }

  async blockUser(userId: Principal): Promise<boolean> {
    // This would need to be implemented based on OpenChat's block user API
    throw new Error('Block user not implemented yet');
  }

  async unblockUser(userId: Principal): Promise<boolean> {
    // This would need to be implemented based on OpenChat's unblock user API
    throw new Error('Unblock user not implemented yet');
  }

  async subscribeToEvents(callback: (event: OpenChatEvent) => void): Promise<void> {
    this.eventSubscribers.push(callback);
    
    // Set up WebSocket connection for real-time events
    if (!this.wsConnection) {
      const wsUrl = this.config.environment === 'local' 
        ? 'ws://localhost:8080/ws' 
        : 'wss://openchat.app/ws';
      
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString()) as OpenChatEvent;
          this.eventSubscribers.forEach(subscriber => subscriber(event));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.wsConnection.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.wsConnection.on('close', () => {
        console.log('WebSocket connection closed');
        this.wsConnection = undefined;
      });
    }
  }

  async unsubscribeFromEvents(): Promise<void> {
    this.eventSubscribers = [];
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
  }

  private convertMessageContent(content: MessageContent): any {
    if (content.text) {
      return { text: { text: content.text } };
    }
    // Add more content type conversions as needed
    throw new Error('Unsupported message content type');
  }

  private parseMessageContent(content: any): MessageContent {
    if (content.text) {
      return { text: content.text.text };
    }
    // Add more content type parsing as needed
    return { text: 'Unsupported content type' };
  }

  generateMessageId(): bigint {
    return BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));
  }

  generateCorrelationId(): bigint {
    return BigInt(Date.now());
  }
}