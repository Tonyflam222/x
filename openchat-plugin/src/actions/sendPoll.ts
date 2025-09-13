import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';

export interface SendPollContent {
  chatId: string;
  question: string;
  options: string[];
  allowMultipleVotes?: boolean;
  anonymous?: boolean;
  endDate?: number;
}

export const sendPollAction: Action = {
  name: 'SEND_POLL_OPENCHAT',
  similes: [
    'SEND_OPENCHAT_POLL',
    'CREATE_POLL_OPENCHAT',
    'POLL_OPENCHAT',
    'OPENCHAT_POLL'
  ],
  description: 'Send a poll to an OpenChat channel or group',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as SendPollContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }
    
    if (!content.question || typeof content.question !== 'string') {
      console.error('Invalid or missing poll question');
      return false;
    }

    if (!content.options || !Array.isArray(content.options) || content.options.length < 2) {
      console.error('Poll must have at least 2 options');
      return false;
    }

    if (content.options.length > 10) {
      console.error('Poll cannot have more than 10 options');
      return false;
    }

    // Validate that all options are strings
    if (!content.options.every(option => typeof option === 'string' && option.trim().length > 0)) {
      console.error('All poll options must be non-empty strings');
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
      const content = message.content as SendPollContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const result = await client.sendMessage({
        chatId: content.chatId,
        content: {
          type: 'poll',
          text: content.question,
          pollOptions: content.options,
          customData: {
            allowMultipleVotes: content.allowMultipleVotes || false,
            anonymous: content.anonymous || false,
            endDate: content.endDate,
          },
        },
      });

      if (result.success) {
        console.log(`Poll sent successfully to chat ${content.chatId}`);
        
        if (callback) {
          callback({
            text: `Poll "${content.question}" sent to OpenChat successfully`,
            content: {
              success: true,
              messageId: result.messageId,
              chatId: content.chatId,
              question: content.question,
              options: content.options,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to send poll:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to send poll: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in sendPollAction:', error);
      
      if (callback) {
        callback({
          text: `Error sending poll: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Create a poll asking what pizza topping people prefer',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll create a pizza topping preference poll.',
          action: 'SEND_POLL_OPENCHAT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Ask the team when they prefer to have our next meeting',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll create a poll to find the best meeting time.',
          action: 'SEND_POLL_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};