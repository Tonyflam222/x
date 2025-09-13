import {
  IAgentRuntime,
  Memory,
  Provider,
  State
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatClient } from './client.js';

export const openChatMessagesProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        return '';
      }

      const chatId = runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID');
      if (!chatId) {
        return '';
      }

      const messages = await openChatClient.getMessages(
        Principal.fromText(chatId),
        undefined,
        false, // descending order
        5 // last 5 messages
      );

      if (messages.length === 0) {
        return 'No recent messages in OpenChat.';
      }

      const formattedMessages = messages.map(msg => {
        const timestamp = new Date(Number(msg.timestamp) / 1000000);
        const sender = msg.sender.toString().slice(0, 8) + '...'; // truncate for readability
        return `[${timestamp.toLocaleTimeString()}] ${sender}: ${msg.content.text || 'Non-text message'}`;
      }).join('\n');

      return `Recent OpenChat messages:\n${formattedMessages}`;
    } catch (error) {
      console.error('Error in openChatMessagesProvider:', error);
      return '';
    }
  }
};

export const openChatUserProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        return '';
      }

      const currentUser = await openChatClient.getCurrentUser();
      
      return `Current OpenChat user: ${currentUser.username} (${currentUser.displayName || 'No display name'})
Premium: ${currentUser.isPremium ? 'Yes' : 'No'}
Status: ${currentUser.suspended ? 'Suspended' : 'Active'}`;
    } catch (error) {
      console.error('Error in openChatUserProvider:', error);
      return '';
    }
  }
};

export const openChatGroupsProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        return '';
      }

      const groups = await openChatClient.getPublicGroups();
      
      if (groups.length === 0) {
        return 'No public OpenChat groups found.';
      }

      const formattedGroups = groups.slice(0, 10).map(group => // limit to 10 groups
        `• ${group.name} (${group.memberCount} members) - ${group.description.slice(0, 100)}${group.description.length > 100 ? '...' : ''}`
      ).join('\n');

      return `Available OpenChat groups:\n${formattedGroups}`;
    } catch (error) {
      console.error('Error in openChatGroupsProvider:', error);
      return '';
    }
  }
};

export const openChatContextProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const openChatClient = runtime.getSetting('OPENCHAT_CLIENT') as OpenChatClient;
      if (!openChatClient) {
        return 'OpenChat client not available.';
      }

      const chatId = runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID');
      const currentUser = await openChatClient.getCurrentUser();
      
      let context = `OpenChat Integration Active
Current User: ${currentUser.username}`;

      if (chatId) {
        context += `\nDefault Chat: ${chatId}`;
        
        // Get recent messages for context
        const messages = await openChatClient.getMessages(
          Principal.fromText(chatId),
          undefined,
          false,
          3
        );

        if (messages.length > 0) {
          context += `\nRecent activity: ${messages.length} messages`;
          const lastMessage = messages[0];
          const timestamp = new Date(Number(lastMessage.timestamp) / 1000000);
          context += `\nLast message: ${timestamp.toLocaleTimeString()} - ${lastMessage.content.text?.slice(0, 50) || 'Non-text message'}${(lastMessage.content.text?.length || 0) > 50 ? '...' : ''}`;
        }
      }

      return context;
    } catch (error) {
      console.error('Error in openChatContextProvider:', error);
      return 'OpenChat context unavailable.';
    }
  }
};