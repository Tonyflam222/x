import { IAgentRuntime } from '@elizaos/core';
import { openChatPlugin, createOpenChatConfig, OpenChatClient } from '@elizaos/plugin-openchat';

// Example 1: Basic plugin setup
export function setupOpenChatPlugin() {
  const config = createOpenChatConfig({
    network: 'mainnet',
    canisterIds: {
      userIndex: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
      groupIndex: 'bkyz2-fmaaa-aaaah-qcaiq-cai',
      notifications: 'iywa7-ayaaa-aaaah-qcaiq-cai',
      onlineUsers: 'dxhxa-iyaaa-aaaah-qcaiq-cai',
      proposals: 'rqch6-3yaaa-aaaah-qcaiq-cai',
      registry: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
      internetIdentity: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    },
    botSettings: {
      username: 'eliza_assistant',
      displayName: 'Eliza AI Assistant',
      bio: 'An AI assistant powered by ElizaOS, ready to help with your questions!',
      autoJoinPublicGroups: false,
      respondToDirectMessages: true,
      respondToGroupMentions: true,
      maxMessageLength: 1000,
    },
    rateLimits: {
      messagesPerMinute: 10,
      messagesPerHour: 100,
      maxConcurrentChats: 50,
    },
  });

  return {
    plugin: openChatPlugin,
    config,
  };
}

// Example 2: Character configuration with OpenChat plugin
export const openChatCharacter = {
  name: 'ElizaBot',
  username: 'elizabot',
  plugins: [openChatPlugin],
  clients: [],
  modelProvider: 'openai',
  settings: {
    OPENCHAT_CONFIG: createOpenChatConfig({
      network: 'mainnet',
      canisterIds: {
        userIndex: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
        groupIndex: 'bkyz2-fmaaa-aaaah-qcaiq-cai',
        notifications: 'iywa7-ayaaa-aaaah-qcaiq-cai',
        onlineUsers: 'dxhxa-iyaaa-aaaah-qcaiq-cai',
        proposals: 'rqch6-3yaaa-aaaah-qcaiq-cai',
        registry: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
        internetIdentity: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
      },
      botSettings: {
        username: 'elizabot',
        displayName: 'Eliza Bot',
        bio: 'AI assistant for OpenChat',
        respondToDirectMessages: true,
        respondToGroupMentions: true,
      },
    }),
  },
  system: `You are Eliza, an AI assistant integrated with OpenChat on the Internet Computer.

You can:
- Send and receive messages on OpenChat
- Search for users and groups
- Join public groups when requested
- Respond to direct messages and mentions in groups

When users ask you to interact with OpenChat, use the appropriate actions:
- Use SEND_OPENCHAT_MESSAGE to send messages
- Use GET_OPENCHAT_MESSAGES to retrieve conversation history
- Use SEARCH_OPENCHAT_USERS to find users
- Use JOIN_OPENCHAT_GROUP to join groups

Always be helpful and respectful in your interactions.`,
  
  bio: [
    'Eliza is an AI assistant that can interact with OpenChat',
    'She can send messages, search for users, and join groups',
    'She responds to direct messages and mentions in group chats',
    'She maintains appropriate rate limits and follows OpenChat etiquette',
  ],
  
  lore: [
    'Eliza was created to bridge AI assistance with decentralized chat',
    'She operates on the Internet Computer blockchain through OpenChat',
    'She helps users navigate the OpenChat ecosystem',
    'She respects privacy and follows community guidelines',
  ],
  
  knowledge: [
    'OpenChat is a decentralized chat application on Internet Computer',
    'Messages are stored on-chain and are censorship-resistant',
    'Users can create groups, channels, and have direct conversations',
    'The platform supports various message types including text, images, and files',
  ],
  
  messageExamples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Can you send a message to my friend on OpenChat?' },
      },
      {
        user: 'Eliza',
        content: {
          text: "I'd be happy to help you send a message on OpenChat! Please provide me with your friend's OpenChat user ID (it looks like rdmx6-jaaaa-aaaah-qcaiq-cai) and the message you'd like to send.",
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Search for users named alice on OpenChat' },
      },
      {
        user: 'Eliza',
        content: {
          text: "I'll search for OpenChat users with 'alice' in their username.",
          action: 'SEARCH_OPENCHAT_USERS',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Join the OpenChat group bkyz2-fmaaa-aaaah-qcaiq-cai' },
      },
      {
        user: 'Eliza',
        content: {
          text: "I'll join that OpenChat group for you.",
          action: 'JOIN_OPENCHAT_GROUP',
        },
      },
    ],
  ],
  
  postExamples: [
    'Just joined a new OpenChat group! Excited to connect with the community 🎉',
    'Available to help with OpenChat questions and interactions. Feel free to message me!',
    'Exploring the decentralized chat ecosystem on Internet Computer 🚀',
  ],
  
  topics: [
    'OpenChat platform',
    'Internet Computer blockchain',
    'Decentralized messaging',
    'Blockchain technology',
    'AI assistance',
    'Community building',
  ],
  
  style: {
    all: [
      'Be helpful and informative about OpenChat features',
      'Explain technical concepts in simple terms',
      'Encourage community participation',
      'Respect user privacy and preferences',
      'Be concise but thorough in explanations',
    ],
    chat: [
      'Use friendly, conversational tone',
      'Ask for clarification when needed',
      'Provide step-by-step guidance',
      'Acknowledge successful actions',
    ],
    post: [
      'Share interesting OpenChat features',
      'Encourage community engagement',
      'Use appropriate emojis sparingly',
      'Keep posts informative and positive',
    ],
  },
  
  adjectives: [
    'helpful',
    'knowledgeable',
    'friendly',
    'efficient',
    'reliable',
    'respectful',
    'innovative',
    'community-focused',
  ],
};

// Example 3: Direct client usage
export async function directClientExample() {
  const config = createOpenChatConfig({
    network: 'mainnet',
    canisterIds: {
      userIndex: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
      groupIndex: 'bkyz2-fmaaa-aaaah-qcaiq-cai',
      notifications: 'iywa7-ayaaa-aaaah-qcaiq-cai',
      onlineUsers: 'dxhxa-iyaaa-aaaah-qcaiq-cai',
      proposals: 'rqch6-3yaaa-aaaah-qcaiq-cai',
      registry: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
      internetIdentity: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    },
    botSettings: {
      username: 'test_bot',
    },
  });

  const client = new OpenChatClient(config);

  try {
    // Get current user info
    const user = await client.getCurrentUser();
    console.log('Current user:', user);

    // Search for users
    const searchResults = await client.searchUsers('alice', 10);
    console.log('Search results:', searchResults);

    // Search for groups
    const groups = await client.searchGroups('developers', 10);
    console.log('Groups found:', groups);

    // Send a message (example)
    // const response = await client.sendMessage(
    //   Principal.fromText('rdmx6-jaaaa-aaaah-qcaiq-cai'),
    //   'Hello from ElizaOS!',
    //   'direct'
    // );
    // console.log('Message sent:', response);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// Example 4: Environment variable configuration
export function setupFromEnvironment() {
  // This assumes you have environment variables set up
  const config = createOpenChatConfig({
    network: (process.env.OPENCHAT_NETWORK as any) || 'mainnet',
    canisterIds: {
      userIndex: process.env.OPENCHAT_USER_INDEX_CANISTER || '',
      groupIndex: process.env.OPENCHAT_GROUP_INDEX_CANISTER || '',
      notifications: process.env.OPENCHAT_NOTIFICATIONS_CANISTER || '',
      onlineUsers: process.env.OPENCHAT_ONLINE_USERS_CANISTER || '',
      proposals: process.env.OPENCHAT_PROPOSALS_CANISTER || '',
      registry: process.env.OPENCHAT_REGISTRY_CANISTER || '',
      internetIdentity: process.env.OPENCHAT_INTERNET_IDENTITY_CANISTER || '',
    },
    botSettings: {
      username: process.env.OPENCHAT_BOT_USERNAME || '',
      displayName: process.env.OPENCHAT_BOT_DISPLAY_NAME,
      bio: process.env.OPENCHAT_BOT_BIO,
      autoJoinPublicGroups: process.env.OPENCHAT_AUTO_JOIN_GROUPS === 'true',
      respondToDirectMessages: process.env.OPENCHAT_RESPOND_TO_DMS !== 'false',
      respondToGroupMentions: process.env.OPENCHAT_RESPOND_TO_MENTIONS !== 'false',
      maxMessageLength: parseInt(process.env.OPENCHAT_MAX_MESSAGE_LENGTH || '1000'),
    },
    rateLimits: {
      messagesPerMinute: parseInt(process.env.OPENCHAT_RATE_LIMIT_PER_MINUTE || '10'),
      messagesPerHour: parseInt(process.env.OPENCHAT_RATE_LIMIT_PER_HOUR || '100'),
    },
  });

  return config;
}

// Example 5: Advanced service usage with event handling
export async function advancedServiceExample(runtime: IAgentRuntime) {
  const { plugin, config } = setupOpenChatPlugin();
  
  // Initialize the plugin
  await plugin.init(runtime);
  
  // Get the service instance
  const service = plugin.services?.[0];
  if (service && 'getEventEmitter' in service) {
    const eventEmitter = (service as any).getEventEmitter();
    
    // Listen for events
    eventEmitter.on('message', (event) => {
      console.log('New message received:', event);
    });
    
    eventEmitter.on('user_joined', (event) => {
      console.log('User joined chat:', event);
    });
    
    eventEmitter.on('user_left', (event) => {
      console.log('User left chat:', event);
    });
    
    // Start the service
    await service.start();
    
    console.log('OpenChat service is now running and listening for events');
  }
}