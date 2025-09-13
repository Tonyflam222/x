import { EventEmitter } from 'events';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import FormData from 'form-data';
import {
  OpenChatMessage,
  OpenChatEvent,
  OpenChatBotConfig,
  SendMessageOptions,
  CreateChannelOptions,
  InviteMembersOptions,
  RemoveMembersOptions,
  OpenChatResponse,
  OpenChatChannel,
  OpenChatUser
} from './types.js';

export class OpenChatClient extends EventEmitter {
  private config: OpenChatBotConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(config: OpenChatBotConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      if (this.config.webhookUrl) {
        // WebSocket connection for real-time events
        this.ws = new WebSocket(this.config.webhookUrl);
        
        this.ws.on('open', () => {
          console.log('OpenChat WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected');
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const event = JSON.parse(data.toString()) as OpenChatEvent;
            this.handleEvent(event);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        this.ws.on('close', () => {
          console.log('OpenChat WebSocket disconnected');
          this.emit('disconnected');
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          console.error('OpenChat WebSocket error:', error);
          this.emit('error', error);
        });
      }
    } catch (error) {
      console.error('Failed to connect to OpenChat:', error);
      throw error;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  private handleEvent(event: OpenChatEvent): void {
    switch (event.eventType) {
      case 'message':
        const message = event.data as OpenChatMessage;
        this.emit('message', message);
        break;
      case 'member_joined':
        this.emit('memberJoined', event.data);
        break;
      case 'member_left':
        this.emit('memberLeft', event.data);
        break;
      case 'channel_created':
        this.emit('channelCreated', event.data);
        break;
      case 'channel_deleted':
        this.emit('channelDeleted', event.data);
        break;
      case 'user_invited':
        this.emit('userInvited', event.data);
        break;
      case 'user_removed':
        this.emit('userRemoved', event.data);
        break;
      default:
        this.emit('event', event);
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<OpenChatResponse> {
    try {
      const endpoint = `${this.config.apiEndpoint}/send_message`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chat_id: options.chatId,
          content: options.content,
          reply_to: options.replyTo,
          thread_root_message_index: options.threadRootMessageIndex,
        }),
      });

      const result = await response.json() as OpenChatResponse;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendImage(chatId: string, imageData: Buffer, fileName?: string, caption?: string): Promise<OpenChatResponse> {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('image', imageData, fileName || 'image.jpg');
      if (caption) {
        formData.append('caption', caption);
      }

      const endpoint = `${this.config.apiEndpoint}/send_image`;
      const headers: Record<string, string> = {};

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json() as OpenChatResponse;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error sending image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendFile(chatId: string, fileData: Buffer, fileName: string, mimeType?: string): Promise<OpenChatResponse> {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('file', fileData, fileName);
      if (mimeType) {
        formData.append('mime_type', mimeType);
      }

      const endpoint = `${this.config.apiEndpoint}/send_file`;
      const headers: Record<string, string> = {};

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json() as OpenChatResponse;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error sending file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createChannel(options: CreateChannelOptions): Promise<OpenChatResponse<{ chatId: string }>> {
    try {
      const endpoint = `${this.config.apiEndpoint}/create_channel`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: options.name,
          description: options.description,
          is_public: options.isPublic,
          permissions: options.permissions,
        }),
      });

      const result = await response.json() as OpenChatResponse<{ chatId: string }>;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error creating channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteChannel(chatId: string): Promise<OpenChatResponse> {
    try {
      const endpoint = `${this.config.apiEndpoint}/delete_channel`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ chat_id: chatId }),
      });

      const result = await response.json() as OpenChatResponse;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error deleting channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async inviteMembers(options: InviteMembersOptions): Promise<OpenChatResponse> {
    try {
      const endpoint = `${this.config.apiEndpoint}/invite_members`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chat_id: options.chatId,
          user_ids: options.userIds,
        }),
      });

      const result = await response.json() as OpenChatResponse;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error inviting members:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async removeMembers(options: RemoveMembersOptions): Promise<OpenChatResponse> {
    try {
      const endpoint = `${this.config.apiEndpoint}/remove_members`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chat_id: options.chatId,
          user_ids: options.userIds,
        }),
      });

      const result = await response.json() as OpenChatResponse;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error removing members:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getChatDetails(chatId: string): Promise<OpenChatResponse<OpenChatChannel>> {
    try {
      const endpoint = `${this.config.apiEndpoint}/chat_details/${chatId}`;
      const headers: Record<string, string> = {};

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      const result = await response.json() as OpenChatResponse<OpenChatChannel>;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error getting chat details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMessages(chatId: string, limit = 50, before?: string): Promise<OpenChatResponse<OpenChatMessage[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (before) {
        params.append('before', before);
      }

      const endpoint = `${this.config.apiEndpoint}/messages/${chatId}?${params.toString()}`;
      const headers: Record<string, string> = {};

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      const result = await response.json() as OpenChatResponse<OpenChatMessage[]>;
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error getting messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}