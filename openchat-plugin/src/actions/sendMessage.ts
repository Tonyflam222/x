import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';

export interface SendMessageContent {
  chatId: string;
  text: string;
  replyTo?: string;
  threadRootMessageIndex?: number;
}

export const sendMessageAction: Action = {
  name: 'SEND_MESSAGE_OPENCHAT',
  similes: [
    'SEND_OPENCHAT_MESSAGE',
    'MESSAGE_OPENCHAT',
    'OPENCHAT_SEND',
    'REPLY_OPENCHAT',
    'RESPOND_OPENCHAT'
  ],
  description: 'Send a text message to an OpenChat channel or direct message',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as SendMessageContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }
    
    if (!content.text || typeof content.text !== 'string') {
      console.error('Invalid or missing text content');
      return false;
    }

    // Check if OpenChat client is available
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
  ): Promise<void> => {
    try {
      const content = message.content as SendMessageContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      const result = await client.sendMessage({
        chatId: content.chatId,
        content: {
          type: 'text',
          text: content.text,
        },
        replyTo: content.replyTo,
        threadRootMessageIndex: content.threadRootMessageIndex,
      });

      if (result.success) {
        console.log(`Message sent successfully to chat ${content.chatId}`);
        
        if (callback) {
          callback({
            text: `Message sent to OpenChat successfully`,
            content: {
              success: true,
              messageId: result.messageId,
              chatId: content.chatId,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to send message:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to send message: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in sendMessageAction:', error);
      
      if (callback) {
        callback({
          text: `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Send a message to the general channel saying hello',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll send a hello message to the general channel.',
          action: 'SEND_MESSAGE_OPENCHAT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Reply to the last message in chat 12345 with "Thanks for the info!"',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll reply to the message with thanks.',
          action: 'SEND_MESSAGE_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};