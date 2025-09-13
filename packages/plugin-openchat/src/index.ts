import {
  Plugin,
  IAgentRuntime,
  elizaLogger
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatService } from './services.js';
import { OpenChatConfig } from './types.js';
import {
  sendMessageAction,
  joinGroupAction,
  getMessagesAction,
  listGroupsAction
} from './actions.js';
import {
  openChatMessagesProvider,
  openChatUserProvider,
  openChatGroupsProvider,
  openChatContextProvider
} from './providers.js';

export { OpenChatClient } from './client.js';
export { OpenChatService } from './services.js';
export * from './types.js';
export * from './actions.js';
export * from './providers.js';

export const openChatPlugin: Plugin = {
  name: 'openchat',
  description: 'OpenChat integration plugin for ElizaOS agents - enables sending/receiving messages on Internet Computer blockchain chat platform',
  
  actions: [
    sendMessageAction,
    joinGroupAction,
    getMessagesAction,
    listGroupsAction
  ],

  providers: [
    openChatMessagesProvider,
    openChatUserProvider,
    openChatGroupsProvider,
    openChatContextProvider
  ],

  evaluators: [],
  
  services: [],

  clients: [],

  init: async (runtime: IAgentRuntime): Promise<void> => {
    try {
      elizaLogger.info('Initializing OpenChat plugin...');

      // Get configuration from environment variables
      const config: OpenChatConfig = {
        canisterId: runtime.getSetting('OPENCHAT_CANISTER_ID') || 
                   process.env.OPENCHAT_CANISTER_ID || 
                   '6hsbt-vqaaa-aaaaf-aaafq-cai', // Default OpenChat canister ID
        
        environment: (runtime.getSetting('OPENCHAT_ENVIRONMENT') || 
                     process.env.OPENCHAT_ENVIRONMENT || 
                     'ic') as 'local' | 'ic',
        
        host: runtime.getSetting('OPENCHAT_HOST') || 
              process.env.OPENCHAT_HOST,
        
        privateKey: runtime.getSetting('OPENCHAT_PRIVATE_KEY') || 
                   process.env.OPENCHAT_PRIVATE_KEY,
        
        identityProvider: runtime.getSetting('OPENCHAT_IDENTITY_PROVIDER') || 
                         process.env.OPENCHAT_IDENTITY_PROVIDER,
        
        userPrincipal: runtime.getSetting('OPENCHAT_USER_PRINCIPAL') || 
                      process.env.OPENCHAT_USER_PRINCIPAL
      };

      // Validate required configuration
      if (!config.canisterId) {
        throw new Error('OPENCHAT_CANISTER_ID is required');
      }

      // Set default chat ID if provided
      const defaultChatId = runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID') || 
                           process.env.OPENCHAT_DEFAULT_CHAT_ID;
      if (defaultChatId) {
        runtime.setSetting('OPENCHAT_DEFAULT_CHAT_ID', defaultChatId);
      }

      // Initialize the OpenChat service
      const openChatService = new OpenChatService(runtime, config);
      await openChatService.initialize();

      // Store the service in runtime for access by other components
      runtime.setSetting('OPENCHAT_SERVICE', openChatService);

      elizaLogger.success('OpenChat plugin initialized successfully');
      elizaLogger.info(`Connected to OpenChat canister: ${config.canisterId}`);
      elizaLogger.info(`Environment: ${config.environment}`);
      
      if (defaultChatId) {
        elizaLogger.info(`Default chat ID: ${defaultChatId}`);
      }

    } catch (error) {
      elizaLogger.error('Failed to initialize OpenChat plugin:', error);
      throw error;
    }
  }
};

// Export the plugin as default
export default openChatPlugin;

// Utility functions for external use
export const createOpenChatConfig = (options: Partial<OpenChatConfig>): OpenChatConfig => {
  return {
    canisterId: options.canisterId || '6hsbt-vqaaa-aaaaf-aaafq-cai',
    environment: options.environment || 'ic',
    host: options.host,
    privateKey: options.privateKey,
    identityProvider: options.identityProvider,
    userPrincipal: options.userPrincipal
  };
};

export const validateOpenChatConfig = (config: OpenChatConfig): boolean => {
  if (!config.canisterId) {
    elizaLogger.error('OpenChat canister ID is required');
    return false;
  }

  try {
    Principal.fromText(config.canisterId);
  } catch (error) {
    elizaLogger.error('Invalid OpenChat canister ID format');
    return false;
  }

  if (config.userPrincipal) {
    try {
      Principal.fromText(config.userPrincipal);
    } catch (error) {
      elizaLogger.error('Invalid user principal format');
      return false;
    }
  }

  return true;
};

// Helper function to get OpenChat service from runtime
export const getOpenChatService = (runtime: IAgentRuntime): OpenChatService | null => {
  return runtime.getSetting('OPENCHAT_SERVICE') as OpenChatService || null;
};

// Helper function to send a quick message
export const sendQuickMessage = async (
  runtime: IAgentRuntime, 
  chatId: string, 
  message: string
): Promise<boolean> => {
  const service = getOpenChatService(runtime);
  if (!service) {
    elizaLogger.error('OpenChat service not available');
    return false;
  }

  return await service.sendMessage(chatId, message);
};