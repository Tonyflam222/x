import {
  IAgentRuntime,
  Memory,
  Provider,
  State
} from '@elizaos/core';
import { OpenChatClient } from '../client.js';
import { OpenChatMessage } from '../types.js';

export interface MessageContext {
  recentMessages: OpenChatMessage[];
  currentChat: {
    chatId: string;
    name?: string;
    memberCount?: number;
    isPublic?: boolean;
  };
  userInfo?: {
    userId: string;
    username: string;
    displayName?: string;
  };
}

export const openChatMessageProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ): Promise<string> => {
    try {
      const client = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!client) {
        return 'OpenChat client not available';
      }

      // Get the current chat context from the message
      const chatId = message.content.chatId || state?.chatId;
      if (!chatId) {
        return 'No chat context available';
      }

      // Get recent messages for context
      const messagesResult = await client.getMessages(chatId, 10);
      if (!messagesResult.success || !messagesResult.data) {
        return 'Unable to retrieve recent messages';
      }

      const recentMessages = messagesResult.data;

      // Get chat details
      const chatDetailsResult = await client.getChatDetails(chatId);
      const chatDetails = chatDetailsResult.success ? chatDetailsResult.data : null;

      // Build context string
      let context = `OpenChat Context for ${chatDetails?.name || chatId}:\n`;
      
      if (chatDetails) {
        context += `- Chat Type: ${chatDetails.isPublic ? 'Public' : 'Private'} channel\n`;
        context += `- Members: ${chatDetails.memberCount}\n`;
        context += `- Description: ${chatDetails.description || 'No description'}\n`;
      }

      context += `\nRecent Messages (${recentMessages.length}):\n`;
      
      for (const msg of recentMessages.slice(-5)) { // Show last 5 messages
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        context += `[${timestamp}] ${msg.senderName}: `;
        
        switch (msg.content.type) {
          case 'text':
            context += msg.content.text || '';
            break;
          case 'image':
            context += '[Image]';
            if (msg.content.text) context += ` ${msg.content.text}`;
            break;
          case 'video':
            context += '[Video]';
            if (msg.content.text) context += ` ${msg.content.text}`;
            break;
          case 'audio':
            context += '[Audio]';
            if (msg.content.text) context += ` ${msg.content.text}`;
            break;
          case 'file':
            context += `[File: ${msg.content.fileName || 'Unknown'}]`;
            break;
          case 'poll':
            context += '[Poll]';
            if (msg.content.text) context += ` ${msg.content.text}`;
            break;
          case 'giphy':
            context += '[GIF]';
            break;
          default:
            context += '[Unknown message type]';
        }
        
        if (msg.edited) {
          context += ' (edited)';
        }
        
        context += '\n';
      }

      // Add current message context if available
      if (message.content.text) {
        context += `\nCurrent Message: ${message.content.text}\n`;
      }

      // Add any relevant state information
      if (state) {
        const stateKeys = Object.keys(state);
        if (stateKeys.length > 0) {
          context += '\nCurrent State:\n';
          for (const key of stateKeys) {
            if (key !== 'chatId' && typeof state[key] === 'string') {
              context += `- ${key}: ${state[key]}\n`;
            }
          }
        }
      }

      return context;
    } catch (error) {
      console.error('Error in openChatMessageProvider:', error);
      return `Error retrieving OpenChat context: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};