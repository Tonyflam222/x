import {
  Plugin,
  IAgentRuntime,
  Action,
  Provider,
  Service,
} from '@elizaos/core';
import { OpenChatConfig } from './types';
import { openChatActions } from './actions';
import { openChatProviders } from './providers';
import { OpenChatService } from './services';

export * from './types';
export * from './client';
export * from './actions';
export * from './providers';
export * from './services';

export const openChatPlugin: Plugin = {
  name: 'openchat',
  description: 'OpenChat plugin for ElizaOS agents to interact with the OpenChat platform on Internet Computer',
  actions: openChatActions,
  providers: openChatProviders,
  evaluators: [],
  services: [],
  
  async init(runtime: IAgentRuntime): Promise<void> {
    // Get OpenChat configuration
    const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
    
    if (!config) {
      console.warn('OpenChat plugin: No configuration found. Please set OPENCHAT_CONFIG environment variable.');
      return;
    }

    // Validate required configuration
    if (!config.canisterIds || !config.canisterIds.userIndex) {
      throw new Error('OpenChat plugin: Missing required canister IDs in configuration');
    }

    if (!config.botSettings || !config.botSettings.username) {
      throw new Error('OpenChat plugin: Missing bot settings in configuration');
    }

    // Initialize OpenChat service
    const openChatService = new OpenChatService(runtime, config);
    
    try {
      await openChatService.initialize(runtime);
      
      // Add the service to the plugin
      this.services = [openChatService];
      
      console.log('OpenChat plugin initialized successfully');
      runtime.logger?.info('OpenChat plugin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenChat plugin:', error);
      runtime.logger?.error('Failed to initialize OpenChat plugin:', error);
      throw error;
    }
  },
};

// Default export
export default openChatPlugin;

// Helper function to create a default configuration
export function createOpenChatConfig(options: Partial<OpenChatConfig>): OpenChatConfig {
  return {
    network: options.network || 'mainnet',
    canisterIds: {
      userIndex: options.canisterIds?.userIndex || '',
      groupIndex: options.canisterIds?.groupIndex || '',
      notifications: options.canisterIds?.notifications || '',
      onlineUsers: options.canisterIds?.onlineUsers || '',
      proposals: options.canisterIds?.proposals || '',
      registry: options.canisterIds?.registry || '',
      internetIdentity: options.canisterIds?.internetIdentity || '',
      ...options.canisterIds,
    },
    botSettings: {
      username: options.botSettings?.username || '',
      displayName: options.botSettings?.displayName,
      bio: options.botSettings?.bio,
      avatarUrl: options.botSettings?.avatarUrl,
      autoJoinPublicGroups: options.botSettings?.autoJoinPublicGroups ?? false,
      respondToDirectMessages: options.botSettings?.respondToDirectMessages ?? true,
      respondToGroupMentions: options.botSettings?.respondToGroupMentions ?? true,
      maxMessageLength: options.botSettings?.maxMessageLength ?? 1000,
      ...options.botSettings,
    },
    rateLimits: {
      messagesPerMinute: 10,
      messagesPerHour: 100,
      maxConcurrentChats: 50,
      ...options.rateLimits,
    },
    identity: options.identity,
    webhook: options.webhook,
  };
}

// Helper function to validate OpenChat configuration
export function validateOpenChatConfig(config: OpenChatConfig): string[] {
  const errors: string[] = [];

  if (!config.canisterIds?.userIndex) {
    errors.push('Missing userIndex canister ID');
  }

  if (!config.canisterIds?.groupIndex) {
    errors.push('Missing groupIndex canister ID');
  }

  if (!config.botSettings?.username) {
    errors.push('Missing bot username');
  }

  if (config.botSettings?.username && !/^[a-zA-Z0-9_]{3,20}$/.test(config.botSettings.username)) {
    errors.push('Bot username must be 3-20 characters long and contain only letters, numbers, and underscores');
  }

  if (config.botSettings?.maxMessageLength && config.botSettings.maxMessageLength > 4000) {
    errors.push('Maximum message length cannot exceed 4000 characters');
  }

  if (!['local', 'testnet', 'mainnet'].includes(config.network)) {
    errors.push('Network must be one of: local, testnet, mainnet');
  }

  return errors;
}