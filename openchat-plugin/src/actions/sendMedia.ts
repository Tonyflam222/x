import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';
import fs from 'fs';
import path from 'path';

export interface SendMediaContent {
  chatId: string;
  mediaType: 'image' | 'video' | 'audio' | 'file';
  filePath?: string;
  fileData?: Buffer;
  fileName?: string;
  caption?: string;
  mimeType?: string;
}

export const sendImageAction: Action = {
  name: 'SEND_IMAGE_OPENCHAT',
  similes: [
    'SEND_OPENCHAT_IMAGE',
    'IMAGE_OPENCHAT',
    'OPENCHAT_IMAGE',
    'SHARE_IMAGE_OPENCHAT'
  ],
  description: 'Send an image to an OpenChat channel or direct message',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as SendMediaContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }
    
    if (!content.filePath && !content.fileData) {
      console.error('Either filePath or fileData must be provided');
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
      const content = message.content as SendMediaContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      let imageData: Buffer;
      let fileName: string;

      if (content.fileData) {
        imageData = content.fileData;
        fileName = content.fileName || 'image.jpg';
      } else if (content.filePath) {
        imageData = await fs.promises.readFile(content.filePath);
        fileName = content.fileName || path.basename(content.filePath);
      } else {
        throw new Error('No image data provided');
      }

      const result = await client.sendImage(
        content.chatId,
        imageData,
        fileName,
        content.caption
      );

      if (result.success) {
        console.log(`Image sent successfully to chat ${content.chatId}`);
        
        if (callback) {
          callback({
            text: `Image sent to OpenChat successfully`,
            content: {
              success: true,
              messageId: result.messageId,
              chatId: content.chatId,
              fileName,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to send image:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to send image: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in sendImageAction:', error);
      
      if (callback) {
        callback({
          text: `Error sending image: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Send the screenshot.png image to the general channel',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll send the screenshot to the general channel.',
          action: 'SEND_IMAGE_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};

export const sendFileAction: Action = {
  name: 'SEND_FILE_OPENCHAT',
  similes: [
    'SEND_OPENCHAT_FILE',
    'FILE_OPENCHAT',
    'OPENCHAT_FILE',
    'SHARE_FILE_OPENCHAT'
  ],
  description: 'Send a file to an OpenChat channel or direct message',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as SendMediaContent;
    
    if (!content.chatId || typeof content.chatId !== 'string') {
      console.error('Invalid or missing chatId');
      return false;
    }
    
    if (!content.filePath && !content.fileData) {
      console.error('Either filePath or fileData must be provided');
      return false;
    }

    if (!content.fileName) {
      console.error('fileName must be provided for file uploads');
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
      const content = message.content as SendMediaContent;
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;

      let fileData: Buffer;
      let fileName: string;

      if (content.fileData) {
        fileData = content.fileData;
        fileName = content.fileName!;
      } else if (content.filePath) {
        fileData = await fs.promises.readFile(content.filePath);
        fileName = content.fileName || path.basename(content.filePath);
      } else {
        throw new Error('No file data provided');
      }

      const result = await client.sendFile(
        content.chatId,
        fileData,
        fileName,
        content.mimeType
      );

      if (result.success) {
        console.log(`File sent successfully to chat ${content.chatId}`);
        
        if (callback) {
          callback({
            text: `File sent to OpenChat successfully`,
            content: {
              success: true,
              messageId: result.messageId,
              chatId: content.chatId,
              fileName,
            },
          });
        }

        return true;
      } else {
        console.error('Failed to send file:', result.error);
        
        if (callback) {
          callback({
            text: `Failed to send file: ${result.error}`,
            content: {
              success: false,
              error: result.error,
            },
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Error in sendFileAction:', error);
      
      if (callback) {
        callback({
          text: `Error sending file: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          text: 'Send the report.pdf file to the documents channel',
        },
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'I\'ll send the PDF report to the documents channel.',
          action: 'SEND_FILE_OPENCHAT',
        },
      },
    ],
  ] as ActionExample[][],
};