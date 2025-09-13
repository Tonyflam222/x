import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { openChatPlugin, OpenChatClient } from '@elizaos/plugin-openchat';

/**
 * Basic usage example for the OpenChat plugin
 */

// Example character configuration with OpenChat plugin
const characterConfig = {
    name: "OpenChatBot",
    bio: "An AI agent that can interact with OpenChat platform",
    plugins: [openChatPlugin],
    settings: {
        secrets: {
            OPENCHAT_CANISTER_ID: "your_openchat_canister_id",
            OPENCHAT_HOST: "https://ic0.app",
            OPENCHAT_MONITORED_CHATS: "general,tech-support,community",
        }
    },
    messageExamples: [
        [
            {
                user: "user",
                content: { text: "Send a hello message to the general chat" }
            },
            {
                user: "assistant", 
                content: { 
                    text: "I'll send a hello message to the general chat on OpenChat.",
                    action: "SEND_OPENCHAT_MESSAGE"
                }
            }
        ],
        [
            {
                user: "user",
                content: { text: "Join the crypto-discussion group" }
            },
            {
                user: "assistant",
                content: {
                    text: "I'll join the crypto-discussion group on OpenChat.",
                    action: "JOIN_OPENCHAT_GROUP"
                }
            }
        ]
    ]
};

/**
 * Example of setting up and using the OpenChat client directly
 */
async function setupOpenChatClient(runtime: IAgentRuntime) {
    try {
        // Create and start the OpenChat client
        const client = new OpenChatClient(runtime);
        
        // Set up event listeners
        client.on('connected', () => {
            elizaLogger.log('OpenChat client connected successfully');
        });
        
        client.on('message', async (event) => {
            elizaLogger.log('Received message:', event.data.content);
            
            // Example: Auto-react to messages containing "awesome"
            if (event.data.content.toLowerCase().includes('awesome')) {
                await client.openChatService.addReaction(
                    event.data.chatId,
                    event.data.id,
                    '🔥'
                );
            }
        });
        
        client.on('error', (error) => {
            elizaLogger.error('OpenChat client error:', error);
        });
        
        // Start the client
        await client.start();
        
        // Example operations
        await demonstrateBasicOperations(client);
        
        return client;
    } catch (error) {
        elizaLogger.error('Failed to setup OpenChat client:', error);
        throw error;
    }
}

/**
 * Demonstrate basic OpenChat operations
 */
async function demonstrateBasicOperations(client: OpenChatClient) {
    try {
        // Join a group
        const groupId = 'example-group-id';
        const joinSuccess = await client.joinGroup(groupId);
        if (joinSuccess) {
            elizaLogger.log(`Successfully joined group: ${groupId}`);
            
            // Send a welcome message
            await client.sendMessage(groupId, "Hello everyone! I'm your new AI assistant. How can I help you today?");
            
            // Wait a bit, then send a follow-up
            setTimeout(async () => {
                await client.sendMessage(
                    groupId,
                    "I can help with various tasks like answering questions, providing information, and more. Just mention me or ask directly!"
                );
            }, 5000);
        }
        
        // Demonstrate message with reaction
        setTimeout(async () => {
            const messageId = await client.sendMessage(groupId, "What's everyone working on today? 🚀");
            if (messageId) {
                // Add a reaction to our own message
                await client.openChatService.addReaction(groupId, messageId, '👀');
            }
        }, 10000);
        
    } catch (error) {
        elizaLogger.error('Error in basic operations demo:', error);
    }
}

/**
 * Example of handling different message types
 */
function setupAdvancedMessageHandling(client: OpenChatClient) {
    client.on('message', async (event) => {
        const message = event.data;
        const content = message.content.toLowerCase();
        
        try {
            // Handle different types of messages
            if (content.includes('help') || content.includes('?')) {
                await client.sendMessage(
                    message.chatId,
                    "I'm here to help! I can:\n" +
                    "• Answer questions\n" +
                    "• Provide information\n" +
                    "• Help with tasks\n" +
                    "• React to messages\n" +
                    "• And much more! Just ask me directly.",
                    message.id
                );
            }
            
            else if (content.includes('joke') || content.includes('funny')) {
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    "Why did the AI go to therapy? It had too many deep learning issues!",
                    "What do you call a robot that takes the long way around? R2-Detour!",
                ];
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                
                await client.sendMessage(message.chatId, randomJoke, message.id);
                await client.openChatService.addReaction(message.chatId, message.id, '😄');
            }
            
            else if (content.includes('weather')) {
                await client.sendMessage(
                    message.chatId,
                    "I don't have access to weather data right now, but you can check your local weather service or ask me to help you find weather resources!",
                    message.id
                );
            }
            
            else if (content.includes('time')) {
                const currentTime = new Date().toLocaleString();
                await client.sendMessage(
                    message.chatId,
                    `The current time is: ${currentTime}`,
                    message.id
                );
            }
            
            // Auto-react to positive messages
            if (content.includes('great') || content.includes('awesome') || content.includes('amazing')) {
                await client.openChatService.addReaction(message.chatId, message.id, '🎉');
            }
            
            // Auto-react to questions
            if (content.includes('?')) {
                await client.openChatService.addReaction(message.chatId, message.id, '🤔');
            }
            
        } catch (error) {
            elizaLogger.error('Error handling message:', error);
        }
    });
}

/**
 * Example of monitoring multiple chats with different behaviors
 */
async function setupMultiChatMonitoring(client: OpenChatClient) {
    const chatBehaviors = {
        'general': {
            greeting: "Hello everyone! 👋",
            helpMessage: "I'm here to help with general questions and conversations!",
            reactions: ['👍', '❤️', '😊']
        },
        'tech-support': {
            greeting: "Tech support bot ready! 🔧",
            helpMessage: "I can help troubleshoot issues and provide technical guidance!",
            reactions: ['🔧', '💡', '✅']
        },
        'community': {
            greeting: "Community assistant here! 🌟",
            helpMessage: "I'm here to help build our community and facilitate discussions!",
            reactions: ['🌟', '🤝', '🎊']
        }
    };
    
    client.on('message', async (event) => {
        const message = event.data;
        const chatId = message.chatId;
        const behavior = chatBehaviors[chatId as keyof typeof chatBehaviors];
        
        if (behavior) {
            // Use chat-specific behavior
            if (message.content.toLowerCase().includes('help')) {
                await client.sendMessage(chatId, behavior.helpMessage, message.id);
            }
            
            // Use chat-specific reactions
            if (Math.random() < 0.1) { // 10% chance to react
                const randomReaction = behavior.reactions[Math.floor(Math.random() * behavior.reactions.length)];
                await client.openChatService.addReaction(chatId, message.id, randomReaction);
            }
        }
    });
}

// Export the examples for use in other files
export {
    characterConfig,
    setupOpenChatClient,
    demonstrateBasicOperations,
    setupAdvancedMessageHandling,
    setupMultiChatMonitoring,
};