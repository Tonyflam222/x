import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';
import { CreateChannelOptions } from '../types.js';

export interface CreateChannelContent {
  name: string;
  description?: string;
  isPublic: boolean;
  permissions?: {
    canSendMessages?: boolean;
    canInviteUsers?: boolean;
    canRemoveUsers?: boolean;
    canDeleteMessages?: boolean;
    canPinMessages?: boolean;
  };
}

export interface DeleteChannelContent {
  chatId: string;
}

export const createChannelAction: Action = {
  name: 'CREATE_CHANNEL_OPENCHAT',
  similes: [
    'CREATE_OPENCHAT_CHANNEL',
    'NEW_CHANNEL_OPENCHAT',
    'MAKE_CHANNEL_OPENCHAT',
    'OPENCHAT_CREATE_CHANNEL'
  ],
  description: 'Create a new channel in OpenChat',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as CreateChannelContent;
    
    if (!content.name || typeof content.name !== 'string') {
      console.error('Invalid or missing channel name');
      return false;
    }
    
    if (typeof content.isPublic !== 'boolean') {
      console.error('isPublic must be a boolean value');
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
      const content = message.content as CreateChannelContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const channelOptions: CreateChannelOptions = {
        name: content.name,
        description: content.description,
        isPublic: content.isPublic,
        permissions: content.permissions,
      };

      const result = await client.createChannel(channelOptions);

      if (result.success && result.data) {
        console.log(`Channel created successfully: ${content.name} (ID: ${result.data.chatId})`);
        
        if (callback) {
          callback({
            text: `Channel "${content.name}" created successfully`,
            content: {
              success: true,
              chatId: result.data.chatId,
              channelName: content.name,
              isPublic: content.isPublic,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to create channel:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to create channel: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in createChannelAction:', error);
      
      if (callback) {
        callback({
          text: `Error creating channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Create a public channel called "announcements" for important updates',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll create a public announcements channel for important updates.',
          action: 'CREATE_CHANNEL_OPENCHAT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Create a private channel for the development team',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll create a private channel for the development team.',
          action: 'CREATE_CHANNEL_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};

export const deleteChannelAction: Action = {
  name: 'DELETE_CHANNEL_OPENCHAT',
  similes: [
    'DELETE_OPENCHAT_CHANNEL',
    'REMOVE_CHANNEL_OPENCHAT',
    'DESTROY_CHANNEL_OPENCHAT',
    'OPENCHAT_DELETE_CHANNEL'
  ],
  description: 'Delete a channel in OpenChat',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as DeleteChannelContent;
    
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
      const content = message.content as DeleteChannelContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const result = await client.deleteChannel(content.chatId);

      if (result.success) {
        console.log(`Channel deleted successfully: ${content.chatId}`);
        
        if (callback) {
          callback({
            text: `Channel deleted successfully`,
            content: {
              success: true,
              chatId: content.chatId,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to delete channel:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to delete channel: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in deleteChannelAction:', error);
      
      if (callback) {
        callback({
          text: `Error deleting channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Delete the old-announcements channel (ID: 12345)',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll delete the old-announcements channel.',
          action: 'DELETE_CHANNEL_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};