import { Principal } from '@dfinity/principal';
import {
  OpenChatClient,
  OpenChatService,
  createOpenChatConfig,
  validateOpenChatConfig,
  OpenChatError,
  MessageContent,
  ChatType,
} from '@elizaos/plugin-openchat';

// Example 1: Advanced message handling with different content types
export async function advancedMessageHandling() {
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
      username: 'advanced_bot',
      displayName: 'Advanced OpenChat Bot',
      bio: 'Demonstrating advanced OpenChat features',
    },
  });

  const client = new OpenChatClient(config);

  try {
    const chatId = Principal.fromText('rdmx6-jaaaa-aaaah-qcaiq-cai');

    // Send a regular text message
    await client.sendMessage(chatId, 'Hello! This is a text message.', 'direct');

    // Send a reply to a specific message
    await client.sendMessage(
      chatId,
      'This is a reply to your message!',
      'direct',
      42 // Reply to message at index 42
    );

    // Get messages with pagination
    let allMessages = [];
    let startIndex = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await client.getMessages(chatId, 'direct', startIndex, true, 50);
      allMessages.push(...response.messages);
      startIndex += response.messages.length;
      hasMore = response.hasMore;

      // Prevent infinite loops
      if (allMessages.length > 1000) break;
    }

    console.log(`Retrieved ${allMessages.length} messages total`);

    // Process messages by type
    for (const message of allMessages) {
      if (message.content.Text) {
        console.log(`Text message: ${message.content.Text.text}`);
      } else if (message.content.Image) {
        console.log(`Image message: ${message.content.Image.url}`);
        if (message.content.Image.caption) {
          console.log(`Caption: ${message.content.Image.caption}`);
        }
      } else if (message.content.File) {
        console.log(`File message: ${message.content.File?.name}`);
      }
      // Add more content type handling as needed
    }

    // Edit a message
    const editSuccess = await client.editMessage(
      chatId,
      10, // Message index to edit
      'This message has been edited!',
      'direct'
    );
    console.log('Message edit success:', editSuccess);

    // Delete a message
    const deleteSuccess = await client.deleteMessage(chatId, 11, 'direct');
    console.log('Message delete success:', deleteSuccess);

  } catch (error) {
    if (error instanceof OpenChatError) {
      console.error(`OpenChat error (${error.code}):`, error.message);
      console.error('Details:', error.details);
    } else {
      console.error('Unexpected error:', error);
    }
  } finally {
    await client.disconnect();
  }
}

// Example 2: Group management and advanced search
export async function groupManagementExample() {
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
      username: 'group_manager_bot',
      autoJoinPublicGroups: true,
    },
  });

  const client = new OpenChatClient(config);

  try {
    // Search for different types of groups
    const techGroups = await client.searchGroups('technology', 20);
    const cryptoGroups = await client.searchGroups('crypto', 20);
    const socialGroups = await client.searchGroups('social', 20);

    console.log(`Found ${techGroups.length} tech groups`);
    console.log(`Found ${cryptoGroups.length} crypto groups`);
    console.log(`Found ${socialGroups.length} social groups`);

    // Filter groups by criteria
    const publicGroups = [...techGroups, ...cryptoGroups, ...socialGroups].filter(
      group => group.isPublic && group.memberCount > 10 && group.memberCount < 1000
    );

    console.log(`${publicGroups.length} groups match our criteria`);

    // Join selected groups
    for (const group of publicGroups.slice(0, 5)) { // Limit to 5 groups
      try {
        const joinResult = await client.joinGroup(group.chatId);
        if (joinResult.success) {
          console.log(`Successfully joined: ${group.name}`);
          
          // Send introduction message
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          await client.sendMessage(
            group.chatId,
            `Hello everyone! I'm an AI assistant. Feel free to mention me if you need help!`,
            'group'
          );
        } else {
          console.log(`Failed to join ${group.name}: ${joinResult.error}`);
        }
      } catch (error) {
        console.error(`Error joining ${group.name}:`, error);
      }
      
      // Rate limiting - wait between joins
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Search for specific users
    const developers = await client.searchUsers('dev', 50);
    const designers = await client.searchUsers('design', 50);

    console.log(`Found ${developers.users.length} potential developers`);
    console.log(`Found ${designers.users.length} potential designers`);

    // Filter users
    const activeBots = developers.users.filter(user => user.isBot);
    const premiumUsers = [...developers.users, ...designers.users].filter(user => user.isPremium);

    console.log(`${activeBots.length} developer bots found`);
    console.log(`${premiumUsers.length} premium users found`);

  } catch (error) {
    console.error('Group management error:', error);
  } finally {
    await client.disconnect();
  }
}

// Example 3: Real-time event processing with custom handlers
export async function realTimeEventProcessing() {
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
      username: 'event_processor_bot',
      respondToDirectMessages: true,
      respondToGroupMentions: true,
    },
    rateLimits: {
      messagesPerMinute: 20,
      messagesPerHour: 200,
    },
  });

  // Mock runtime for this example
  const mockRuntime = {
    agentId: 'test-agent',
    logger: console,
    getSetting: (key: string) => key === 'OPENCHAT_CONFIG' ? config : undefined,
    processActions: async (memory: any, actions: any, state: any, callback: any) => {
      // Simulate AI response generation
      const responses = [
        "That's interesting! Tell me more.",
        "I understand. How can I help with that?",
        "Thanks for sharing! Is there anything specific you'd like to know?",
        "I see. Would you like me to explain that further?",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      if (callback) {
        callback({
          text: randomResponse,
          content: { text: randomResponse },
        });
      }
    },
  } as any;

  const service = new OpenChatService(mockRuntime, config);

  try {
    await service.initialize(mockRuntime);

    const eventEmitter = service.getEventEmitter();

    // Set up custom event handlers
    eventEmitter.on('message', async (event) => {
      console.log(`📨 New message from ${event.userId?.toString()}`);
      console.log(`Chat: ${event.chatId.toString()}`);
      console.log(`Type: ${event.data.chatType}`);
      
      // Custom processing based on message content
      const messageText = event.data.message.content.Text?.text;
      if (messageText) {
        if (messageText.toLowerCase().includes('help')) {
          console.log('🆘 Help request detected');
        } else if (messageText.toLowerCase().includes('hello')) {
          console.log('👋 Greeting detected');
        } else if (messageText.includes('?')) {
          console.log('❓ Question detected');
        }
      }
    });

    eventEmitter.on('user_joined', async (event) => {
      console.log(`🎉 User ${event.userId?.toString()} joined ${event.chatId.toString()}`);
      
      // Send welcome message after a delay
      setTimeout(async () => {
        const welcomeMessages = [
          "Welcome to the group! 🎉",
          "Great to have you here! Feel free to introduce yourself.",
          "Welcome! Don't hesitate to ask if you have any questions.",
        ];
        
        const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        await service.sendMessage(event.chatId.toString(), message, 'group');
      }, 3000);
    });

    eventEmitter.on('user_left', async (event) => {
      console.log(`👋 User ${event.userId?.toString()} left ${event.chatId.toString()}`);
    });

    eventEmitter.on('message_edited', async (event) => {
      console.log(`✏️ Message edited in ${event.chatId.toString()}`);
    });

    eventEmitter.on('message_deleted', async (event) => {
      console.log(`🗑️ Message deleted in ${event.chatId.toString()}`);
    });

    // Start the service
    await service.start();

    console.log('🚀 Real-time event processing started');
    console.log('The service is now listening for OpenChat events...');

    // Keep the service running for demonstration
    // In a real application, this would run indefinitely
    await new Promise(resolve => setTimeout(resolve, 60000)); // Run for 1 minute

  } catch (error) {
    console.error('Event processing error:', error);
  } finally {
    await service.stop();
  }
}

// Example 4: Configuration validation and error handling
export function configurationExample() {
  // Example of invalid configuration
  const invalidConfig = createOpenChatConfig({
    network: 'invalid' as any,
    canisterIds: {
      userIndex: '', // Missing required field
      groupIndex: 'invalid-id',
      notifications: '',
      onlineUsers: '',
      proposals: '',
      registry: '',
      internetIdentity: '',
    },
    botSettings: {
      username: 'ab', // Too short
      maxMessageLength: 5000, // Too long
    },
  });

  // Validate configuration
  const errors = validateOpenChatConfig(invalidConfig);
  if (errors.length > 0) {
    console.log('Configuration errors found:');
    errors.forEach(error => console.log(`- ${error}`));
  }

  // Example of valid configuration
  const validConfig = createOpenChatConfig({
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
      username: 'valid_bot_name',
      displayName: 'Valid Bot',
      bio: 'A properly configured OpenChat bot',
      maxMessageLength: 1000,
    },
  });

  const validationErrors = validateOpenChatConfig(validConfig);
  if (validationErrors.length === 0) {
    console.log('✅ Configuration is valid');
  }

  return { invalidConfig, validConfig, errors };
}

// Example 5: Batch operations and performance optimization
export async function batchOperationsExample() {
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
      username: 'batch_bot',
    },
  });

  const client = new OpenChatClient(config);

  try {
    // Batch user searches
    const searchQueries = ['alice', 'bob', 'charlie', 'dev', 'admin'];
    const searchPromises = searchQueries.map(query => 
      client.searchUsers(query, 10).catch(error => {
        console.error(`Search for ${query} failed:`, error);
        return { users: [], hasMore: false };
      })
    );

    const searchResults = await Promise.all(searchPromises);
    const allUsers = searchResults.flatMap(result => result.users);
    
    console.log(`Found ${allUsers.length} users total from batch search`);

    // Batch group searches
    const groupQueries = ['tech', 'crypto', 'art', 'music', 'gaming'];
    const groupPromises = groupQueries.map(query =>
      client.searchGroups(query, 5).catch(error => {
        console.error(`Group search for ${query} failed:`, error);
        return [];
      })
    );

    const groupResults = await Promise.all(groupPromises);
    const allGroups = groupResults.flat();

    console.log(`Found ${allGroups.length} groups total from batch search`);

    // Batch message retrieval (if you have chat IDs)
    const chatIds = [
      'rdmx6-jaaaa-aaaah-qcaiq-cai',
      'bkyz2-fmaaa-aaaah-qcaiq-cai',
      // Add more chat IDs as needed
    ];

    const messagePromises = chatIds.map(chatId =>
      client.getMessages(Principal.fromText(chatId), 'direct', undefined, true, 10)
        .catch(error => {
          console.error(`Failed to get messages for ${chatId}:`, error);
          return { messages: [], latestEventIndex: 0, hasMore: false };
        })
    );

    const messageResults = await Promise.all(messagePromises);
    const totalMessages = messageResults.reduce((sum, result) => sum + result.messages.length, 0);

    console.log(`Retrieved ${totalMessages} messages total from ${chatIds.length} chats`);

    // Performance monitoring
    console.time('Batch operations completed in');
    
    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.timeEnd('Batch operations completed in');

  } catch (error) {
    console.error('Batch operations error:', error);
  } finally {
    await client.disconnect();
  }
}

// Example 6: Custom message filtering and processing
export async function messageFilteringExample() {
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
      username: 'filter_bot',
    },
  });

  const client = new OpenChatClient(config);

  try {
    const chatId = Principal.fromText('rdmx6-jaaaa-aaaah-qcaiq-cai');
    const messages = await client.getMessages(chatId, 'direct', undefined, true, 100);

    console.log(`Processing ${messages.messages.length} messages...`);

    // Filter messages by various criteria
    const textMessages = messages.messages.filter(msg => msg.content.Text);
    const imageMessages = messages.messages.filter(msg => msg.content.Image);
    const editedMessages = messages.messages.filter(msg => msg.edited);
    const recentMessages = messages.messages.filter(msg => {
      const messageTime = Number(msg.timestamp) / 1000000; // Convert to milliseconds
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return messageTime > oneDayAgo;
    });

    console.log(`Text messages: ${textMessages.length}`);
    console.log(`Image messages: ${imageMessages.length}`);
    console.log(`Edited messages: ${editedMessages.length}`);
    console.log(`Recent messages (24h): ${recentMessages.length}`);

    // Analyze message content
    const questionMessages = textMessages.filter(msg => 
      msg.content.Text?.text.includes('?')
    );

    const mentionMessages = textMessages.filter(msg =>
      msg.content.Text?.text.includes('@')
    );

    const urlMessages = textMessages.filter(msg =>
      /https?:\/\//.test(msg.content.Text?.text || '')
    );

    console.log(`Questions: ${questionMessages.length}`);
    console.log(`Mentions: ${mentionMessages.length}`);
    console.log(`URLs shared: ${urlMessages.length}`);

    // Word frequency analysis
    const allText = textMessages
      .map(msg => msg.content.Text?.text || '')
      .join(' ')
      .toLowerCase();

    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const wordCount = words.reduce((count, word) => {
      count[word] = (count[word] || 0) + 1;
      return count;
    }, {} as Record<string, number>);

    const topWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('Top 10 words:');
    topWords.forEach(([word, count]) => {
      console.log(`  ${word}: ${count}`);
    });

    // Message timing analysis
    const messagesByHour = messages.messages.reduce((hours, msg) => {
      const hour = new Date(Number(msg.timestamp) / 1000000).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
      return hours;
    }, {} as Record<number, number>);

    console.log('Messages by hour of day:');
    for (let hour = 0; hour < 24; hour++) {
      const count = messagesByHour[hour] || 0;
      if (count > 0) {
        console.log(`  ${hour.toString().padStart(2, '0')}:00 - ${count} messages`);
      }
    }

  } catch (error) {
    console.error('Message filtering error:', error);
  } finally {
    await client.disconnect();
  }
}