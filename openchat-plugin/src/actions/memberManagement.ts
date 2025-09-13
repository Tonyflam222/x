import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';

export interface InviteMembersContent {
  chatId: string;
  userIds: string[];
  usernames?: string[];
}

export interface RemoveMembersContent {
  chatId: string;
  userIds: string[];
  reason?: string;
}

export const inviteMembersAction: Action = {
  name: 'INVITE_MEMBERS_OPENCHAT',
  similes: [
    'INVITE_OPENCHAT_MEMBERS',
    'ADD_MEMBERS_OPENCHAT',
    'OPENCHAT_INVITE',
    'INVITE_USERS_OPENCHAT'
  ],
  description: 'Invite members to an OpenChat channel or group',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as InviteMembersContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }
    
    if (!content.userIds || !Array.isArray(content.userIds) || content.userIds.length === 0) {
      console.error('Invalid or missing userIds array');
      return false;
    }

    // Validate that all userIds are strings
    if (!content.userIds.every(id => typeof id === 'string' && id.length > 0)) {
      console.error('All userIds must be non-empty strings');
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
      const content = message.content as InviteMembersContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const result = await client.inviteMembers({
        chatId: content.chatId,
        userIds: content.userIds,
      });

      if (result.success) {
        console.log(`Members invited successfully to chat ${content.chatId}: ${content.userIds.join(', ')}`);
        
        if (callback) {
          callback({
            text: `Successfully invited ${content.userIds.length} member(s) to the chat`,
            content: {
              success: true,
              chatId: content.chatId,
              invitedUsers: content.userIds,
              usernames: content.usernames,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to invite members:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to invite members: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in inviteMembersAction:', error);
      
      if (callback) {
        callback({
          text: `Error inviting members: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Invite users alice123 and bob456 to the general channel',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll invite alice123 and bob456 to the general channel.',
          action: 'INVITE_MEMBERS_OPENCHAT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Add the new team members to the dev-team channel: user1, user2, user3',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll add the new team members to the dev-team channel.',
          action: 'INVITE_MEMBERS_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};

export const removeMembersAction: Action = {
  name: 'REMOVE_MEMBERS_OPENCHAT',
  similes: [
    'REMOVE_OPENCHAT_MEMBERS',
    'KICK_MEMBERS_OPENCHAT',
    'OPENCHAT_REMOVE',
    'BAN_USERS_OPENCHAT'
  ],
  description: 'Remove members from an OpenChat channel or group',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as RemoveMembersContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }
    
    if (!content.userIds || !Array.isArray(content.userIds) || content.userIds.length === 0) {
      console.error('Invalid or missing userIds array');
      return false;
    }

    // Validate that all userIds are strings
    if (!content.userIds.every(id => typeof id === 'string' && id.length > 0)) {
      console.error('All userIds must be non-empty strings');
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
      const content = message.content as RemoveMembersContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const result = await client.removeMembers({
        chatId: content.chatId,
        userIds: content.userIds,
      });

      if (result.success) {
        console.log(`Members removed successfully from chat ${content.chatId}: ${content.userIds.join(', ')}`);
        
        if (callback) {
          callback({
            text: `Successfully removed ${content.userIds.length} member(s) from the chat`,
            content: {
              success: true,
              chatId: content.chatId,
              removedUsers: content.userIds,
              reason: content.reason,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to remove members:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to remove members: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in removeMembersAction:', error);
      
      if (callback) {
        callback({
          text: `Error removing members: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Remove spammer123 from the general channel for violating rules',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll remove spammer123 from the general channel for rule violations.',
          action: 'REMOVE_MEMBERS_OPENCHAT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Remove inactive users user1 and user2 from the project channel',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll remove the inactive users from the project channel.',
          action: 'REMOVE_MEMBERS_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};