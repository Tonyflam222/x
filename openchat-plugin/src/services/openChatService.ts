import {
  IAgentRuntime,
  Service,
  ServiceType,
  Memory,
  State,
  UUID
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';
import { OpenChatBotConfig, OpenChatMessage } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class OpenChatService extends Service {
  private client: OpenChatClient | null = null;

  static override serviceType: ServiceType = ServiceType.UNKNOWN;

  constructor() {
    super();
  }

  override async initialize(runtime: IAgentRuntime): Promise<void> {
    // Get OpenChat configuration from runtime settings
    const config: OpenChatBotConfig = {
      botId: runtime.getSetting('OPENCHAT_BOT_ID') || '',
      botName: runtime.getSetting('OPENCHAT_BOT_NAME') || 'ElizaBot',
      apiEndpoint: runtime.getSetting('OPENCHAT_API_ENDPOINT') || '',
      webhookUrl: runtime.getSetting('OPENCHAT_WEBHOOK_URL'),
      apiKey: runtime.getSetting('OPENCHAT_API_KEY'),
      principal: runtime.getSetting('OPENCHAT_PRINCIPAL'),
    };

    if (!config.botId || !config.apiEndpoint) {
      throw new Error('OpenChat bot ID and API endpoint are required');
    }

    // Create and configure the OpenChat client
    this.client = new OpenChatClient(config);

    // Set up event handlers
    this.setupEventHandlers(runtime);

    // Store client in runtime for actions to use
    runtime.setSetting('OPENCHAT_CLIENT', this.client);

    // Connect to OpenChat
    await this.client.connect();

    console.log(`OpenChat service initialized for bot: ${config.botName} (${config.botId})`);
  }

  private setupEventHandlers(runtime: IAgentRuntime): void {
    if (!this.client) return;

    // Handle incoming messages
    this.client.on('message', async (message: OpenChatMessage) => {
      await this.handleIncomingMessage(runtime, message);
    });

    // Handle member events
    this.client.on('memberJoined', async (event: any) => {
      console.log(`Member joined chat ${event.chatId}:`, event.user);
      await this.handleMemberEvent(runtime, 'joined', event);
    });

    this.client.on('memberLeft', async (event: any) => {
      console.log(`Member left chat ${event.chatId}:`, event.user);
      await this.handleMemberEvent(runtime, 'left', event);
    });

    // Handle channel events
    this.client.on('channelCreated', async (event: any) => {
      console.log(`Channel created:`, event.channel);
      await this.handleChannelEvent(runtime, 'created', event);
    });

    this.client.on('channelDeleted', async (event: any) => {
      console.log(`Channel deleted:`, event.chatId);
      await this.handleChannelEvent(runtime, 'deleted', event);
    });

    // Handle user invitation events
    this.client.on('userInvited', async (event: any) => {
      console.log(`User invited to chat ${event.chatId}:`, event.user);
      await this.handleUserEvent(runtime, 'invited', event);
    });

    this.client.on('userRemoved', async (event: any) => {
      console.log(`User removed from chat ${event.chatId}:`, event.user);
      await this.handleUserEvent(runtime, 'removed', event);
    });

    // Handle connection events
    this.client.on('connected', () => {
      console.log('OpenChat service connected');
    });

    this.client.on('disconnected', () => {
      console.log('OpenChat service disconnected');
    });

    this.client.on('error', (error: Error) => {
      console.error('OpenChat service error:', error);
    });

    this.client.on('maxReconnectAttemptsReached', () => {
      console.error('OpenChat service: Max reconnection attempts reached');
    });
  }

  private async handleIncomingMessage(runtime: IAgentRuntime, message: OpenChatMessage): Promise<void> {
    if (!this.client) return;

    try {
      // Don't respond to our own messages
      if (message.senderId === this.client['config'].botId) {
        return;
      }

      // Create a memory object from the OpenChat message
      const memory: Memory = {
        id: uuidv4() as UUID,
        userId: message.senderId as UUID,
        agentId: runtime.agentId,
        content: {
          text: message.content.text || '',
          chatId: message.chatId,
          messageType: message.content.type,
          senderName: message.senderName,
          timestamp: message.timestamp,
          ...message.content,
        },
        roomId: uuidv4() as UUID, // Use generated UUID for roomId
        createdAt: message.timestamp,
      };

      // Create state with chat context
      const state: State = {
        chatId: message.chatId,
        userId: message.senderId,
        userName: message.senderName,
        messageType: message.content.type,
        recentMessages: [],
        agentId: runtime.agentId,
        values: new Map(),
        data: {},
        text: message.content.text || '',
      };

      // Process the message through the runtime
      await runtime.processActions(
        memory,
        [],
        state,
        async (response: any) => {
          // Send the response back to OpenChat
          if (response.text && response.text.trim()) {
            await this.client!.sendMessage({
              chatId: message.chatId,
              content: {
                type: 'text',
                text: response.text,
              },
              replyTo: message.messageId,
            });
          }
        }
      );

      console.log(`Processed message from ${message.senderName} in chat ${message.chatId}`);
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  private async handleMemberEvent(runtime: IAgentRuntime, eventType: 'joined' | 'left', event: any): Promise<void> {
    try {
      // Create a memory object for the member event
      const memory: Memory = {
        id: uuidv4() as UUID,
        userId: event.user.userId as UUID,
        agentId: runtime.agentId,
        content: {
          text: `User ${event.user.username} ${eventType} the chat`,
          chatId: event.chatId,
          eventType: `member_${eventType}`,
          user: event.user,
        },
        roomId: uuidv4() as UUID,
        createdAt: Date.now(),
      };

      // Create proper state
      const state: State = {
        chatId: event.chatId,
        eventType: `member_${eventType}`,
        user: event.user,
        agentId: runtime.agentId,
        values: new Map(),
        data: {},
        text: `User ${event.user.username} ${eventType} the chat`,
      };

      // Process the event (this could trigger welcome messages, etc.)
      await runtime.processActions(memory, [], state);
    } catch (error) {
      console.error(`Error handling member ${eventType} event:`, error);
    }
  }

  private async handleChannelEvent(runtime: IAgentRuntime, eventType: 'created' | 'deleted', event: any): Promise<void> {
    try {
      const memory: Memory = {
        id: uuidv4() as UUID,
        userId: 'system' as UUID,
        agentId: runtime.agentId,
        content: {
          text: `Channel ${eventType}: ${event.channel?.name || event.chatId}`,
          chatId: event.chatId || event.channel?.chatId,
          eventType: `channel_${eventType}`,
          channel: event.channel,
        },
        roomId: uuidv4() as UUID,
        createdAt: Date.now(),
      };

      const state: State = {
        chatId: event.chatId || event.channel?.chatId,
        eventType: `channel_${eventType}`,
        channel: event.channel,
        agentId: runtime.agentId,
        values: new Map(),
        data: {},
        text: `Channel ${eventType}: ${event.channel?.name || event.chatId}`,
      };

      await runtime.processActions(memory, [], state);
    } catch (error) {
      console.error(`Error handling channel ${eventType} event:`, error);
    }
  }

  private async handleUserEvent(runtime: IAgentRuntime, eventType: 'invited' | 'removed', event: any): Promise<void> {
    try {
      const memory: Memory = {
        id: uuidv4() as UUID,
        userId: event.user.userId as UUID,
        agentId: runtime.agentId,
        content: {
          text: `User ${event.user.username} was ${eventType} ${eventType === 'invited' ? 'to' : 'from'} the chat`,
          chatId: event.chatId,
          eventType: `user_${eventType}`,
          user: event.user,
        },
        roomId: uuidv4() as UUID,
        createdAt: Date.now(),
      };

      const state: State = {
        chatId: event.chatId,
        eventType: `user_${eventType}`,
        user: event.user,
        agentId: runtime.agentId,
        values: new Map(),
        data: {},
        text: `User ${event.user.username} was ${eventType} ${eventType === 'invited' ? 'to' : 'from'} the chat`,
      };

      await runtime.processActions(memory, [], state);
    } catch (error) {
      console.error(`Error handling user ${eventType} event:`, error);
    }
  }

  override async stop(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    console.log('OpenChat service stopped');
  }

  override get capabilityDescription(): string {
    return 'OpenChat integration service that handles real-time messaging, events, and bot interactions with the OpenChat blockchain platform';
  }
}