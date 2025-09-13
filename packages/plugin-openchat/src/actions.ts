import {
  Action,
  ActionExample,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  composeContext,
  generateObject,
  ModelClass
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatClient } from './client.js';
import { MessageContent } from './types.js';

// Send Message Action
export const sendMessageAction: Action = {
  name: 'SEND_OPENCHAT_MESSAGE',
  similes: [
    'SEND_MESSAGE',
    'REPLY',
    'RESPOND',
    'SAY',
    'POST_MESSAGE',
    'WRITE_MESSAGE'
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
    return !!openChatClient;
  },
  description: 'Send a message to an OpenChat group or channel',
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        throw new Error('OpenChat client not initialized');
      }

      const messageText = message.content.text;
      const chatId = message.content.source || runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID');
      
      if (!chatId) {
        throw new Error('No chat ID specified');
      }

      const content: MessageContent = {
        text: messageText
      };

      const sendArgs = {
        chatId: Principal.fromText(chatId),
        messageId: openChatClient.generateMessageId(),
        content,
        correlationId: openChatClient.generateCorrelationId()
      };

      const response = await openChatClient.sendMessage(sendArgs);
      
      if (callback) {
        callback({
          text: `Message sent successfully to OpenChat. Message index: ${response.messageIndex}`,
          content: {
            success: true,
            messageIndex: response.messageIndex,
            eventIndex: response.eventIndex,
            timestamp: response.timestamp
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending OpenChat message:', error);
      if (callback) {
        callback({
          text: `Failed to send message: ${error.message}`,
          content: { success: false, error: error.message }
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Send a message to the main chat saying hello everyone!'
        }
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll send that message to OpenChat for you.',
          action: 'SEND_OPENCHAT_MESSAGE'
        }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Post an update about the latest developments in the project channel'
        }
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll post the update to the OpenChat project channel.',
          action: 'SEND_OPENCHAT_MESSAGE'
        }
      }
    ]
  ] as ActionExample[][]
};

// Join Group Action
export const joinGroupAction: Action = {
  name: 'JOIN_OPENCHAT_GROUP',
  similes: [
    'JOIN_GROUP',
    'JOIN_CHAT',
    'ENTER_GROUP',
    'JOIN_CHANNEL'
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
    return !!openChatClient;
  },
  description: 'Join an OpenChat group or channel',
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        throw new Error('OpenChat client not initialized');
      }

      // Extract group ID from message content
      const groupId = message.content.source || message.content.groupId;
      if (!groupId) {
        throw new Error('No group ID specified');
      }

      const success = await openChatClient.joinGroup(Principal.fromText(groupId));
      
      if (callback) {
        if (success) {
          callback({
            text: `Successfully joined OpenChat group: ${groupId}`,
            content: { success: true, groupId }
          });
        } else {
          callback({
            text: `Failed to join OpenChat group: ${groupId}`,
            content: { success: false, groupId }
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Error joining OpenChat group:', error);
      if (callback) {
        callback({
          text: `Failed to join group: ${error.message}`,
          content: { success: false, error: error.message }
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Join the developers group on OpenChat'
        }
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll join the developers group on OpenChat.',
          action: 'JOIN_OPENCHAT_GROUP'
        }
      }
    ]
  ] as ActionExample[][]
};

// Get Messages Action
export const getMessagesAction: Action = {
  name: 'GET_OPENCHAT_MESSAGES',
  similes: [
    'GET_MESSAGES',
    'FETCH_MESSAGES',
    'READ_MESSAGES',
    'CHECK_MESSAGES',
    'VIEW_MESSAGES'
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
    return !!openChatClient;
  },
  description: 'Retrieve messages from an OpenChat group or channel',
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        throw new Error('OpenChat client not initialized');
      }

      const chatId = message.content.source || runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID');
      if (!chatId) {
        throw new Error('No chat ID specified');
      }

      const maxResults = message.content.maxResults || 10;
      const messages = await openChatClient.getMessages(
        Principal.fromText(chatId),
        undefined,
        false, // descending order (newest first)
        maxResults
      );

      if (callback) {
        const messageTexts = messages.map(msg => 
          `[${new Date(Number(msg.timestamp) / 1000000).toISOString()}] ${msg.sender.toString()}: ${msg.content.text || 'Non-text message'}`
        ).join('\n');

        callback({
          text: `Retrieved ${messages.length} messages from OpenChat:\n${messageTexts}`,
          content: {
            success: true,
            messages: messages.map(msg => ({
              id: msg.messageId.toString(),
              sender: msg.sender.toString(),
              text: msg.content.text,
              timestamp: msg.timestamp.toString()
            }))
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error getting OpenChat messages:', error);
      if (callback) {
        callback({
          text: `Failed to get messages: ${error.message}`,
          content: { success: false, error: error.message }
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Get the latest messages from the main chat'
        }
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll fetch the latest messages from OpenChat.',
          action: 'GET_OPENCHAT_MESSAGES'
        }
      }
    ]
  ] as ActionExample[][]
};

// List Groups Action
export const listGroupsAction: Action = {
  name: 'LIST_OPENCHAT_GROUPS',
  similes: [
    'LIST_GROUPS',
    'SHOW_GROUPS',
    'GET_GROUPS',
    'FIND_GROUPS',
    'BROWSE_GROUPS'
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
    return !!openChatClient;
  },
  description: 'List available OpenChat groups',
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        throw new Error('OpenChat client not initialized');
      }

      const groups = await openChatClient.getPublicGroups();

      if (callback) {
        const groupList = groups.map(group => 
          `• ${group.name} (${group.memberCount} members) - ${group.description}`
        ).join('\n');

        callback({
          text: `Found ${groups.length} public OpenChat groups:\n${groupList}`,
          content: {
            success: true,
            groups: groups.map(group => ({
              id: group.chatId.toString(),
              name: group.name,
              description: group.description,
              memberCount: group.memberCount,
              isPublic: group.isPublic
            }))
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error listing OpenChat groups:', error);
      if (callback) {
        callback({
          text: `Failed to list groups: ${error.message}`,
          content: { success: false, error: error.message }
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Show me all available OpenChat groups'
        }
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll list all available OpenChat groups for you.',
          action: 'LIST_OPENCHAT_GROUPS'
        }
      }
    ]
  ] as ActionExample[][]
};