import {
  Service,
  IAgentRuntime,
  ServiceType,
  Memory,
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatClient } from './client';
import { OpenChatConfig, OpenChatEvent } from './types';
import { EventEmitter } from 'events';

export class OpenChatService extends Service {
  static serviceType: ServiceType = ServiceType.CHAT;
  
  private client: OpenChatClient;
  private config: OpenChatConfig;
  private eventEmitter: EventEmitter;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastEventIndices: Map<string, number> = new Map();
  private isRunning: boolean = false;

  constructor(runtime: IAgentRuntime, config: OpenChatConfig) {
    super();
    this.config = config;
    this.client = new OpenChatClient(config);
    this.eventEmitter = new EventEmitter();
    this.setupEventHandlers(runtime);
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    try {
      // Verify connection to OpenChat
      const currentUser = await this.client.getCurrentUser();
      if (currentUser) {
        console.log(`OpenChat service initialized for user: ${currentUser.username}`);
        runtime.logger?.info(`OpenChat service initialized for user: ${currentUser.username}`);
      } else {
        console.log('OpenChat service initialized (no current user found)');
        runtime.logger?.info('OpenChat service initialized (no current user found)');
      }
    } catch (error) {
      console.error('Failed to initialize OpenChat service:', error);
      runtime.logger?.error('Failed to initialize OpenChat service:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('Starting OpenChat service...');

    try {
      // Start polling for direct messages if configured
      if (this.config.botSettings.respondToDirectMessages) {
        await this.startDirectMessagePolling();
      }

      // Start polling for group messages if configured
      if (this.config.botSettings.respondToGroupMentions) {
        await this.startGroupMessagePolling();
      }

      console.log('OpenChat service started successfully');
    } catch (error) {
      console.error('Failed to start OpenChat service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('Stopping OpenChat service...');

    // Clear all polling intervals
    for (const [chatId, interval] of this.pollingIntervals) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();
    this.lastEventIndices.clear();

    // Disconnect the client
    await this.client.disconnect();

    console.log('OpenChat service stopped');
  }

  private setupEventHandlers(runtime: IAgentRuntime): void {
    this.eventEmitter.on('message', async (event: OpenChatEvent) => {
      await this.handleIncomingMessage(runtime, event);
    });

    this.eventEmitter.on('mention', async (event: OpenChatEvent) => {
      await this.handleMention(runtime, event);
    });

    this.eventEmitter.on('user_joined', async (event: OpenChatEvent) => {
      await this.handleUserJoined(runtime, event);
    });

    this.eventEmitter.on('user_left', async (event: OpenChatEvent) => {
      await this.handleUserLeft(runtime, event);
    });
  }

  private async startDirectMessagePolling(): Promise<void> {
    try {
      const directChats = await this.client.getDirectChats();
      
      for (const chat of directChats) {
        const chatId = chat.chatId.toString();
        
        // Initialize last event index
        this.lastEventIndices.set(chatId, 0);
        
        // Start polling for this chat
        const interval = setInterval(async () => {
          await this.pollChatForEvents(chatId, 'direct');
        }, 5000); // Poll every 5 seconds

        this.pollingIntervals.set(chatId, interval);
      }

      console.log(`Started polling for ${directChats.length} direct chats`);
    } catch (error) {
      console.error('Failed to start direct message polling:', error);
    }
  }

  private async startGroupMessagePolling(): Promise<void> {
    try {
      const groupChats = await this.client.getGroupChats();
      
      for (const chat of groupChats) {
        const chatId = chat.chatId.toString();
        
        // Initialize last event index
        this.lastEventIndices.set(chatId, 0);
        
        // Start polling for this chat
        const interval = setInterval(async () => {
          await this.pollChatForEvents(chatId, 'group');
        }, 10000); // Poll every 10 seconds for groups

        this.pollingIntervals.set(chatId, interval);
      }

      console.log(`Started polling for ${groupChats.length} group chats`);
    } catch (error) {
      console.error('Failed to start group message polling:', error);
    }
  }

  private async pollChatForEvents(chatId: string, chatType: 'direct' | 'group'): Promise<void> {
    try {
      const lastEventIndex = this.lastEventIndices.get(chatId) || 0;
      const chatPrincipal = Principal.fromText(chatId);
      
      const events = await this.client.pollForEvents(chatPrincipal, lastEventIndex);
      
      for (const event of events) {
        await this.processEvent(event, chatId, chatType);
        
        // Update last event index
        if (event.event_index > lastEventIndex) {
          this.lastEventIndices.set(chatId, event.event_index);
        }
      }
    } catch (error) {
      console.error(`Error polling events for chat ${chatId}:`, error);
    }
  }

  private async processEvent(event: any, chatId: string, chatType: 'direct' | 'group'): Promise<void> {
    const chatPrincipal = Principal.fromText(chatId);
    
    switch (event.event.kind) {
      case 'message':
        const messageEvent: OpenChatEvent = {
          type: 'message',
          chatId: chatPrincipal,
          userId: event.event.sender,
          messageIndex: event.event.message_index,
          timestamp: event.timestamp,
          data: {
            message: event.event,
            chatType,
          },
        };
        this.eventEmitter.emit('message', messageEvent);
        break;

      case 'message_edited':
        const editEvent: OpenChatEvent = {
          type: 'message_edited',
          chatId: chatPrincipal,
          userId: event.event.sender,
          messageIndex: event.event.message_index,
          timestamp: event.timestamp,
          data: {
            message: event.event,
            chatType,
          },
        };
        this.eventEmitter.emit('message_edited', editEvent);
        break;

      case 'message_deleted':
        const deleteEvent: OpenChatEvent = {
          type: 'message_deleted',
          chatId: chatPrincipal,
          userId: event.event.sender,
          messageIndex: event.event.message_index,
          timestamp: event.timestamp,
          data: {
            message: event.event,
            chatType,
          },
        };
        this.eventEmitter.emit('message_deleted', deleteEvent);
        break;

      case 'participants_added':
        for (const userId of event.event.user_ids) {
          const joinEvent: OpenChatEvent = {
            type: 'user_joined',
            chatId: chatPrincipal,
            userId: userId,
            timestamp: event.timestamp,
            data: {
              chatType,
              addedBy: event.event.added_by,
            },
          };
          this.eventEmitter.emit('user_joined', joinEvent);
        }
        break;

      case 'participants_removed':
        for (const userId of event.event.user_ids) {
          const leaveEvent: OpenChatEvent = {
            type: 'user_left',
            chatId: chatPrincipal,
            userId: userId,
            timestamp: event.timestamp,
            data: {
              chatType,
              removedBy: event.event.removed_by,
            },
          };
          this.eventEmitter.emit('user_left', leaveEvent);
        }
        break;

      default:
        // Handle other event types as needed
        break;
    }
  }

  private async handleIncomingMessage(runtime: IAgentRuntime, event: OpenChatEvent): Promise<void> {
    try {
      const { message, chatType } = event.data;
      
      // Skip messages from the bot itself
      const currentUser = await this.client.getCurrentUser();
      if (currentUser && event.userId?.equals(currentUser.userId)) {
        return;
      }

      // Check rate limits
      if (!this.checkRateLimit(event.chatId.toString())) {
        console.log(`Rate limit exceeded for chat ${event.chatId.toString()}`);
        return;
      }

      // Extract message content
      const messageContent = message.content.Text?.text;
      if (!messageContent) {
        return; // Skip non-text messages for now
      }

      // Check if this is a mention in a group chat
      const isMention = chatType === 'group' && this.isBotMentioned(messageContent, currentUser?.username);
      
      // Decide whether to respond
      const shouldRespond = 
        (chatType === 'direct' && this.config.botSettings.respondToDirectMessages) ||
        (chatType === 'group' && this.config.botSettings.respondToGroupMentions && isMention);

      if (!shouldRespond) {
        return;
      }

      // Create memory object for the message
      const memory: Memory = {
        id: `openchat-${event.chatId.toString()}-${event.messageIndex}`,
        userId: event.userId?.toString() || 'unknown',
        agentId: runtime.agentId,
        roomId: event.chatId.toString(),
        content: {
          text: messageContent,
          source: 'openchat',
          metadata: {
            chatType,
            messageIndex: event.messageIndex,
            timestamp: event.timestamp,
          },
        },
        createdAt: Number(event.timestamp) / 1000000, // Convert nanoseconds to milliseconds
      };

      // Process the message through the agent
      await runtime.processActions(memory, [], undefined, async (response) => {
        if (response && response.text) {
          // Send response back to OpenChat
          await this.client.sendMessage(
            event.chatId,
            response.text,
            chatType,
            event.messageIndex // Reply to the original message
          );
        }
      });

    } catch (error) {
      console.error('Error handling incoming OpenChat message:', error);
    }
  }

  private async handleMention(runtime: IAgentRuntime, event: OpenChatEvent): Promise<void> {
    // Handle mentions specifically (already handled in handleIncomingMessage)
    await this.handleIncomingMessage(runtime, event);
  }

  private async handleUserJoined(runtime: IAgentRuntime, event: OpenChatEvent): Promise<void> {
    try {
      // Optionally send a welcome message
      if (this.config.botSettings.autoJoinPublicGroups && event.data.chatType === 'group') {
        const welcomeMessage = `Welcome to the group! 👋`;
        
        setTimeout(async () => {
          await this.client.sendMessage(event.chatId, welcomeMessage, 'group');
        }, 2000); // Wait 2 seconds before sending welcome
      }
    } catch (error) {
      console.error('Error handling user joined event:', error);
    }
  }

  private async handleUserLeft(runtime: IAgentRuntime, event: OpenChatEvent): Promise<void> {
    // Handle user leaving (optional functionality)
    console.log(`User ${event.userId?.toString()} left chat ${event.chatId.toString()}`);
  }

  private isBotMentioned(messageContent: string, botUsername?: string): boolean {
    if (!botUsername) return false;
    
    // Check for @username mentions
    const mentionPattern = new RegExp(`@${botUsername}\\b`, 'i');
    return mentionPattern.test(messageContent);
  }

  private rateLimitCounts: Map<string, { minute: number, hour: number, lastReset: number }> = new Map();

  private checkRateLimit(chatId: string): boolean {
    const limits = this.config.rateLimits;
    if (!limits) return true;

    const now = Date.now();
    const counts = this.rateLimitCounts.get(chatId) || { minute: 0, hour: 0, lastReset: now };
    
    // Reset counters if needed
    if (now - counts.lastReset > 60000) { // 1 minute
      counts.minute = 0;
    }
    if (now - counts.lastReset > 3600000) { // 1 hour
      counts.hour = 0;
      counts.lastReset = now;
    }

    // Check limits
    if (limits.messagesPerMinute && counts.minute >= limits.messagesPerMinute) {
      return false;
    }
    if (limits.messagesPerHour && counts.hour >= limits.messagesPerHour) {
      return false;
    }

    // Increment counters
    counts.minute++;
    counts.hour++;
    this.rateLimitCounts.set(chatId, counts);

    return true;
  }

  // Public methods for external use
  async sendMessage(chatId: string, message: string, chatType: 'direct' | 'group' = 'direct'): Promise<boolean> {
    try {
      const chatPrincipal = Principal.fromText(chatId);
      const response = await this.client.sendMessage(chatPrincipal, message, chatType);
      return response.success;
    } catch (error) {
      console.error('Error sending message via service:', error);
      return false;
    }
  }

  async joinGroup(groupId: string): Promise<boolean> {
    try {
      const groupPrincipal = Principal.fromText(groupId);
      const response = await this.client.joinGroup(groupPrincipal);
      
      if (response.success) {
        // Start polling for this new group
        this.lastEventIndices.set(groupId, 0);
        const interval = setInterval(async () => {
          await this.pollChatForEvents(groupId, 'group');
        }, 10000);
        this.pollingIntervals.set(groupId, interval);
      }
      
      return response.success;
    } catch (error) {
      console.error('Error joining group via service:', error);
      return false;
    }
  }

  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
}