import {
  IAgentRuntime,
  Service,
  ServiceType,
  Memory,
  State
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatClient } from './client.js';
import { OpenChatConfig, OpenChatEvent } from './types.js';

export class OpenChatService extends Service {
  static serviceType: ServiceType = ServiceType.OTHER;
  
  private client: OpenChatClient;
  private runtime: IAgentRuntime;
  private isRunning: boolean = false;
  private eventHandlers: Map<string, (event: OpenChatEvent) => void> = new Map();

  constructor(runtime: IAgentRuntime, config: OpenChatConfig) {
    super();
    this.runtime = runtime;
    this.client = new OpenChatClient(config);
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    try {
      // Store client in runtime settings for use by actions and providers
      this.runtime.setSetting('OPENCHAT_CLIENT', this.client);
      
      // Subscribe to events
      await this.client.subscribeToEvents(this.handleEvent.bind(this));
      
      this.isRunning = true;
      console.log('OpenChat service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenChat service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.client.unsubscribeFromEvents();
      this.isRunning = false;
      console.log('OpenChat service stopped');
    }
  }

  private setupEventHandlers(): void {
    // Handle incoming messages
    this.eventHandlers.set('message', async (event: OpenChatEvent) => {
      if (event.type === 'message' && event.content) {
        // Create a memory object for the incoming message
        const memory: Memory = {
          id: `openchat-${event.messageId}`,
          userId: event.userId?.toString() || 'unknown',
          agentId: this.runtime.agentId,
          roomId: event.chatId.toString(),
          content: {
            text: event.content.text || '',
            source: 'openchat',
            chatId: event.chatId.toString(),
            messageId: event.messageId?.toString(),
            timestamp: event.timestamp
          },
          createdAt: Number(event.timestamp) / 1000000 // Convert nanoseconds to milliseconds
        };

        // Process the message through the runtime
        try {
          await this.runtime.processActions(memory, [], {} as State);
        } catch (error) {
          console.error('Error processing OpenChat message:', error);
        }
      }
    });

    // Handle user joined events
    this.eventHandlers.set('member_joined', async (event: OpenChatEvent) => {
      console.log(`User ${event.userId} joined chat ${event.chatId}`);
      // Could trigger welcome messages or other actions
    });

    // Handle user left events
    this.eventHandlers.set('member_left', async (event: OpenChatEvent) => {
      console.log(`User ${event.userId} left chat ${event.chatId}`);
    });

    // Handle reactions
    this.eventHandlers.set('reaction_added', async (event: OpenChatEvent) => {
      console.log(`Reaction added to message ${event.messageId} in chat ${event.chatId}`);
    });
  }

  private async handleEvent(event: OpenChatEvent): Promise<void> {
    try {
      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        await handler(event);
      } else {
        console.log(`Unhandled OpenChat event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling OpenChat event:', error);
    }
  }

  // Method to send a message (can be called by actions)
  async sendMessage(chatId: string, text: string, options?: {
    threadRootMessageIndex?: number;
    replyingTo?: { eventIndex: number };
  }): Promise<boolean> {
    try {
      const response = await this.client.sendMessage({
        chatId: Principal.fromText(chatId),
        messageId: this.client.generateMessageId(),
        content: { text },
        correlationId: this.client.generateCorrelationId(),
        ...options
      });

      console.log(`Message sent to OpenChat: ${response.messageIndex}`);
      return true;
    } catch (error) {
      console.error('Error sending message via service:', error);
      return false;
    }
  }

  // Method to join a group
  async joinGroup(chatId: string): Promise<boolean> {
    try {
      const success = await this.client.joinGroup(Principal.fromText(chatId));
      if (success) {
        console.log(`Successfully joined OpenChat group: ${chatId}`);
      }
      return success;
    } catch (error) {
      console.error('Error joining group via service:', error);
      return false;
    }
  }

  // Method to get recent messages
  async getRecentMessages(chatId: string, count: number = 10): Promise<any[]> {
    try {
      const messages = await this.client.getMessages(
        Principal.fromText(chatId),
        undefined,
        false, // descending
        count
      );

      return messages.map(msg => ({
        id: msg.messageId.toString(),
        sender: msg.sender.toString(),
        text: msg.content.text,
        timestamp: Number(msg.timestamp) / 1000000 // Convert to milliseconds
      }));
    } catch (error) {
      console.error('Error getting recent messages via service:', error);
      return [];
    }
  }

  // Method to get available groups
  async getAvailableGroups(): Promise<any[]> {
    try {
      const groups = await this.client.getPublicGroups();
      return groups.map(group => ({
        id: group.chatId.toString(),
        name: group.name,
        description: group.description,
        memberCount: group.memberCount,
        isPublic: group.isPublic
      }));
    } catch (error) {
      console.error('Error getting available groups via service:', error);
      return [];
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.getCurrentUser();
      return true;
    } catch (error) {
      console.error('OpenChat service health check failed:', error);
      return false;
    }
  }

  // Get service status
  getStatus(): { running: boolean; connected: boolean } {
    return {
      running: this.isRunning,
      connected: !!this.client
    };
  }
}