import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatClient } from './client';
import { OpenChatConfig, ChatType } from './types';

// Provider to get current user information
export const currentUserProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        return '';
      }

      const client = new OpenChatClient(config);
      const currentUser = await client.getCurrentUser();

      if (currentUser) {
        return `Current OpenChat user: ${currentUser.username} (${currentUser.userId.toString()})${
          currentUser.displayName ? ` - ${currentUser.displayName}` : ''
        }${currentUser.isBot ? ' [BOT]' : ''}`;
      }

      return 'No OpenChat user information available';
    } catch (error) {
      console.error('Error getting current OpenChat user:', error);
      return 'Error retrieving OpenChat user information';
    }
  },
};

// Provider to get recent messages context
export const recentMessagesProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        return '';
      }

      // Extract chat context from the conversation
      const chatId = extractChatIdFromState(state);
      if (!chatId) {
        return '';
      }

      const client = new OpenChatClient(config);
      const chatPrincipal = Principal.fromText(chatId);
      
      const response = await client.getMessages(chatPrincipal, 'direct', undefined, true, 5);
      
      if (response.messages.length === 0) {
        return '';
      }

      const recentMessages = response.messages
        .map(msg => {
          const timestamp = new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString();
          const content = msg.content.Text?.text || '[Non-text message]';
          const sender = msg.sender.toString().substring(0, 8) + '...';
          return `[${timestamp}] ${sender}: ${content}`;
        })
        .join('\n');

      return `Recent OpenChat messages:\n${recentMessages}`;
    } catch (error) {
      console.error('Error getting recent OpenChat messages:', error);
      return '';
    }
  },
};

// Provider to get chat information
export const chatInfoProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        return '';
      }

      const client = new OpenChatClient(config);
      
      // Get direct chats
      const directChats = await client.getDirectChats();
      const groupChats = await client.getGroupChats();

      let info = '';
      
      if (directChats.length > 0) {
        info += `Direct chats (${directChats.length}):\n`;
        info += directChats.slice(0, 5).map(chat => 
          `- ${chat.username}${chat.displayName ? ` (${chat.displayName})` : ''} - ${chat.unreadCount} unread`
        ).join('\n');
        if (directChats.length > 5) {
          info += `\n... and ${directChats.length - 5} more`;
        }
        info += '\n\n';
      }

      if (groupChats.length > 0) {
        info += `Group chats (${groupChats.length}):\n`;
        info += groupChats.slice(0, 5).map(chat => 
          `- ${chat.name} (${chat.memberCount} members)${chat.isPublic ? ' [PUBLIC]' : ''}`
        ).join('\n');
        if (groupChats.length > 5) {
          info += `\n... and ${groupChats.length - 5} more`;
        }
      }

      return info || 'No active OpenChat conversations';
    } catch (error) {
      console.error('Error getting OpenChat info:', error);
      return 'Error retrieving OpenChat information';
    }
  },
};

// Provider for OpenChat status and configuration
export const openChatStatusProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        return 'OpenChat plugin not configured';
      }

      const status = [
        `OpenChat Network: ${config.network}`,
        `Bot Username: ${config.botSettings.username}`,
        `Auto-join Public Groups: ${config.botSettings.autoJoinPublicGroups ? 'Yes' : 'No'}`,
        `Respond to DMs: ${config.botSettings.respondToDirectMessages ? 'Yes' : 'No'}`,
        `Respond to Mentions: ${config.botSettings.respondToGroupMentions ? 'Yes' : 'No'}`,
      ];

      if (config.rateLimits) {
        status.push(`Rate Limits: ${config.rateLimits.messagesPerMinute || 'None'}/min, ${config.rateLimits.messagesPerHour || 'None'}/hour`);
      }

      return status.join('\n');
    } catch (error) {
      console.error('Error getting OpenChat status:', error);
      return 'Error retrieving OpenChat status';
    }
  },
};

// Provider for getting user search results context
export const userSearchProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        return '';
      }

      // Extract search query from message
      const searchQuery = extractSearchQueryFromMessage(message.content.text);
      if (!searchQuery) {
        return '';
      }

      const client = new OpenChatClient(config);
      const response = await client.searchUsers(searchQuery, 5);

      if (response.users.length === 0) {
        return `No OpenChat users found matching "${searchQuery}"`;
      }

      const userList = response.users.map(user => 
        `${user.username} (${user.userId.toString().substring(0, 12)}...)${user.displayName ? ` - ${user.displayName}` : ''}${user.isBot ? ' [BOT]' : ''}`
      ).join('\n');

      return `OpenChat users matching "${searchQuery}":\n${userList}${response.hasMore ? '\n... and more' : ''}`;
    } catch (error) {
      console.error('Error searching OpenChat users:', error);
      return '';
    }
  },
};

// Provider for group search results
export const groupSearchProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        return '';
      }

      const searchQuery = extractSearchQueryFromMessage(message.content.text);
      if (!searchQuery) {
        return '';
      }

      const client = new OpenChatClient(config);
      const groups = await client.searchGroups(searchQuery, 5);

      if (groups.length === 0) {
        return `No OpenChat groups found matching "${searchQuery}"`;
      }

      const groupList = groups.map(group => 
        `${group.name} (${group.memberCount} members)${group.isPublic ? ' [PUBLIC]' : ' [PRIVATE]'} - ${group.description.substring(0, 50)}${group.description.length > 50 ? '...' : ''}`
      ).join('\n');

      return `OpenChat groups matching "${searchQuery}":\n${groupList}`;
    } catch (error) {
      console.error('Error searching OpenChat groups:', error);
      return '';
    }
  },
};

// Utility functions
function extractChatIdFromState(state?: State): string | null {
  if (!state) return null;
  
  // Look for chat ID in various state properties
  const stateString = JSON.stringify(state);
  const principalPattern = /([a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3})/i;
  const match = stateString.match(principalPattern);
  return match ? match[1] : null;
}

function extractSearchQueryFromMessage(text: string): string | null {
  const patterns = [
    /search.*?for.*?"([^"]+)"/i,
    /search.*?for.*?'([^']+)'/i,
    /find.*?"([^"]+)"/i,
    /find.*?'([^']+)'/i,
    /looking.*?for.*?"([^"]+)"/i,
    /looking.*?for.*?'([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export const openChatProviders = [
  currentUserProvider,
  recentMessagesProvider,
  chatInfoProvider,
  openChatStatusProvider,
  userSearchProvider,
  groupSearchProvider,
];