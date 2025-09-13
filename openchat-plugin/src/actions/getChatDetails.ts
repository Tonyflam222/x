import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';

export interface GetChatDetailsContent {
  chatId: string;
}

export const getChatDetailsAction: Action = {
  name: 'GET_CHAT_DETAILS_OPENCHAT',
  similes: [
    'GET_OPENCHAT_CHAT_DETAILS',
    'CHAT_INFO_OPENCHAT',
    'OPENCHAT_CHAT_INFO',
    'FETCH_CHAT_DETAILS_OPENCHAT'
  ],
  description: 'Get details about an OpenChat channel or group',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as GetChatDetailsContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }

    const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
    if (!client) {
      console.error('OpenChat client not available');
      return false;
    }

    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const content = message.content as GetChatDetailsContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const result = await client.getChatDetails(content.chatId);

      if (result.success && result.data) {
        const chatDetails = result.data;
        console.log(`Chat details retrieved for ${content.chatId}:`, chatDetails);
        
        if (callback) {
          callback({
            text: `Chat Details for ${chatDetails.name}:
- Chat ID: ${chatDetails.chatId}
- Name: ${chatDetails.name}
- Description: ${chatDetails.description || 'No description'}
- Public: ${chatDetails.isPublic ? 'Yes' : 'No'}
- Members: ${chatDetails.memberCount}
- Last Activity: ${new Date(chatDetails.lastActivity).toLocaleString()}
- Permissions:
  - Send Messages: ${chatDetails.permissions.canSendMessages ? 'Yes' : 'No'}
  - Invite Users: ${chatDetails.permissions.canInviteUsers ? 'Yes' : 'No'}
  - Remove Users: ${chatDetails.permissions.canRemoveUsers ? 'Yes' : 'No'}
  - Delete Messages: ${chatDetails.permissions.canDeleteMessages ? 'Yes' : 'No'}
  - Pin Messages: ${chatDetails.permissions.canPinMessages ? 'Yes' : 'No'}`,
            content: {
              success: true,
              chatDetails: chatDetails,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to get chat details:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to get chat details: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in getChatDetailsAction:', error);
      
      if (callback) {
        callback({
          text: `Error getting chat details: ${error instanceof Error ? error.message : 'Unknown error'}`,
          content: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
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
          text: 'Get details about the general channel',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll get the details for the general channel.',
          action: 'GET_CHAT_DETAILS_OPENCHAT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Show me information about chat ID 12345',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll retrieve the information for chat 12345.',
          action: 'GET_CHAT_DETAILS_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};