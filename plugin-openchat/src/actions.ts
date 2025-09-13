import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  ActionExample,
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatClient } from './client';
import { OpenChatConfig, ChatType } from './types';

// Send message action
export const sendMessageAction: Action = {
  name: 'SEND_OPENCHAT_MESSAGE',
  similes: [
    'SEND_MESSAGE_OPENCHAT',
    'OPENCHAT_SEND',
    'MESSAGE_OPENCHAT',
    'CHAT_OPENCHAT',
    'SEND_OPENCHAT',
  ],
  description: 'Send a message to an OpenChat user or group',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
    return !!config && !!config.canisterIds.userIndex;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      const client = new OpenChatClient(config);

      // Extract parameters from the message or options
      const chatId = options.chatId || extractChatId(message.content.text);
      const messageText = options.message || extractMessageContent(message.content.text);
      const chatType: ChatType = options.chatType || 'direct';
      const replyToMessageIndex = options.replyTo;

      if (!chatId) {
        if (callback) {
          callback({
            text: 'Error: No chat ID specified. Please provide a valid OpenChat user or group ID.',
            content: { error: 'Missing chat ID' },
          });
        }
        return false;
      }

      if (!messageText) {
        if (callback) {
          callback({
            text: 'Error: No message content specified.',
            content: { error: 'Missing message content' },
          });
        }
        return false;
      }

      // Convert string chat ID to Principal
      const chatPrincipal = Principal.fromText(chatId);
      
      const response = await client.sendMessage(
        chatPrincipal,
        messageText,
        chatType,
        replyToMessageIndex
      );

      if (response.success) {
        if (callback) {
          callback({
            text: `Message sent successfully to OpenChat! Message ID: ${response.messageId}`,
            content: {
              success: true,
              messageId: response.messageId?.toString(),
              messageIndex: response.messageIndex,
              timestamp: response.timestamp?.toString(),
            },
          });
        }
        return true;
      } else {
        if (callback) {
          callback({
            text: `Failed to send message: ${response.error}`,
            content: { error: response.error },
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Error sending OpenChat message:', error);
      if (callback) {
        callback({
          text: `Error sending message: ${error.message}`,
          content: { error: error.message },
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
          text: 'Send a message to OpenChat user rdmx6-jaaaa-aaaah-qcaiq-cai saying "Hello from ElizaOS!"',
        },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'I\'ll send that message to the OpenChat user for you.',
          action: 'SEND_OPENCHAT_MESSAGE',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Message the OpenChat group bkyz2-fmaaa-aaaah-qcaiq-cai with "The bot is now online!"',
        },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Sending your message to the OpenChat group now.',
          action: 'SEND_OPENCHAT_MESSAGE',
        },
      },
    ],
  ] as ActionExample[][],
};

// Get messages action
export const getMessagesAction: Action = {
  name: 'GET_OPENCHAT_MESSAGES',
  similes: [
    'FETCH_OPENCHAT_MESSAGES',
    'OPENCHAT_MESSAGES',
    'READ_OPENCHAT_CHAT',
    'GET_OPENCHAT_HISTORY',
  ],
  description: 'Retrieve messages from an OpenChat conversation',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
    return !!config && !!config.canisterIds.userIndex;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      const client = new OpenChatClient(config);

      const chatId = options.chatId || extractChatId(message.content.text);
      const chatType: ChatType = options.chatType || 'direct';
      const maxMessages = options.maxMessages || 20;
      const startIndex = options.startIndex;

      if (!chatId) {
        if (callback) {
          callback({
            text: 'Error: No chat ID specified.',
            content: { error: 'Missing chat ID' },
          });
        }
        return false;
      }

      const chatPrincipal = Principal.fromText(chatId);
      const response = await client.getMessages(
        chatPrincipal,
        chatType,
        startIndex,
        true,
        maxMessages
      );

      if (callback) {
        const messageList = response.messages.map(msg => {
          const content = msg.content.Text?.text || '[Non-text message]';
          return `[${new Date(Number(msg.timestamp) / 1000000).toLocaleString()}] ${msg.sender.toString()}: ${content}`;
        }).join('\n');

        callback({
          text: `Retrieved ${response.messages.length} messages from OpenChat:\n\n${messageList}`,
          content: {
            messages: response.messages,
            latestEventIndex: response.latestEventIndex,
            hasMore: response.hasMore,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error getting OpenChat messages:', error);
      if (callback) {
        callback({
          text: `Error retrieving messages: ${error.message}`,
          content: { error: error.message },
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
          text: 'Get the latest messages from OpenChat user rdmx6-jaaaa-aaaah-qcaiq-cai',
        },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'I\'ll fetch the recent messages from that OpenChat conversation.',
          action: 'GET_OPENCHAT_MESSAGES',
        },
      },
    ],
  ] as ActionExample[][],
};

// Join group action
export const joinGroupAction: Action = {
  name: 'JOIN_OPENCHAT_GROUP',
  similes: [
    'OPENCHAT_JOIN_GROUP',
    'JOIN_OPENCHAT',
    'OPENCHAT_GROUP_JOIN',
  ],
  description: 'Join an OpenChat group',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
    return !!config && !!config.canisterIds.groupIndex;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      const client = new OpenChatClient(config);

      const groupId = options.groupId || extractChatId(message.content.text);

      if (!groupId) {
        if (callback) {
          callback({
            text: 'Error: No group ID specified.',
            content: { error: 'Missing group ID' },
          });
        }
        return false;
      }

      const groupPrincipal = Principal.fromText(groupId);
      const response = await client.joinGroup(groupPrincipal);

      if (response.success) {
        if (callback) {
          callback({
            text: `Successfully joined OpenChat group: ${groupId}`,
            content: { success: true, groupId },
          });
        }
        return true;
      } else {
        if (callback) {
          callback({
            text: `Failed to join group: ${response.error}`,
            content: { error: response.error },
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Error joining OpenChat group:', error);
      if (callback) {
        callback({
          text: `Error joining group: ${error.message}`,
          content: { error: error.message },
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
          text: 'Join the OpenChat group bkyz2-fmaaa-aaaah-qcaiq-cai',
        },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'I\'ll join that OpenChat group for you.',
          action: 'JOIN_OPENCHAT_GROUP',
        },
      },
    ],
  ] as ActionExample[][],
};

// Search users action
export const searchUsersAction: Action = {
  name: 'SEARCH_OPENCHAT_USERS',
  similes: [
    'OPENCHAT_SEARCH_USERS',
    'FIND_OPENCHAT_USERS',
    'OPENCHAT_USER_SEARCH',
  ],
  description: 'Search for users on OpenChat',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
    return !!config && !!config.canisterIds.userIndex;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      const client = new OpenChatClient(config);

      const query = options.query || extractSearchQuery(message.content.text);
      const limit = options.limit || 10;

      if (!query) {
        if (callback) {
          callback({
            text: 'Error: No search query specified.',
            content: { error: 'Missing search query' },
          });
        }
        return false;
      }

      const response = await client.searchUsers(query, limit);

      if (callback) {
        const userList = response.users.map(user => 
          `${user.username} (${user.userId.toString()})${user.displayName ? ` - ${user.displayName}` : ''}`
        ).join('\n');

        callback({
          text: `Found ${response.users.length} users matching "${query}":\n\n${userList}`,
          content: {
            users: response.users,
            hasMore: response.hasMore,
            query,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error searching OpenChat users:', error);
      if (callback) {
        callback({
          text: `Error searching users: ${error.message}`,
          content: { error: error.message },
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
          text: 'Search for OpenChat users with username containing "alice"',
        },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'I\'ll search for OpenChat users matching "alice".',
          action: 'SEARCH_OPENCHAT_USERS',
        },
      },
    ],
  ] as ActionExample[][],
};

// Utility functions for parsing message content
function extractChatId(text: string): string | null {
  // Look for Principal ID patterns in the text
  const principalPattern = /([a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3})/i;
  const match = text.match(principalPattern);
  return match ? match[1] : null;
}

function extractMessageContent(text: string): string | null {
  // Extract message content from various patterns
  const patterns = [
    /(?:send|message|say|tell).*?"([^"]+)"/i,
    /(?:send|message|say|tell).*?'([^']+)'/i,
    /(?:with|saying)\s+"([^"]+)"/i,
    /(?:with|saying)\s+'([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractSearchQuery(text: string): string | null {
  const patterns = [
    /search.*?for.*?"([^"]+)"/i,
    /search.*?for.*?'([^']+)'/i,
    /find.*?users.*?"([^"]+)"/i,
    /find.*?users.*?'([^']+)'/i,
    /containing\s+"([^"]+)"/i,
    /containing\s+'([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export const openChatActions = [
  sendMessageAction,
  getMessagesAction,
  joinGroupAction,
  searchUsersAction,
];