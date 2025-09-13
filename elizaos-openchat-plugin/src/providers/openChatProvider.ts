import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { OpenChatService } from "../services/openchat.js";
import { OpenChatMessage } from "../types/index.js";

export const openChatProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            const canisterId = runtime.getSetting("OPENCHAT_CANISTER_ID");
            const host = runtime.getSetting("OPENCHAT_HOST") || "https://ic0.app";
            
            if (!canisterId) {
                return "OpenChat not configured";
            }

            const openChatService = new OpenChatService({
                canisterId,
                host,
                fetchRootKey: runtime.getSetting("OPENCHAT_FETCH_ROOT_KEY") === "true",
            });

            const chatId = (state as any)?.chatId || message.content.source;
            if (!chatId || typeof chatId !== 'string') {
                return "No chat context available";
            }

            // Get recent messages and user info
            const [messages, userInfo] = await Promise.all([
                openChatService.getMessages(chatId, undefined, 20),
                message.userId ? openChatService.getUser(message.userId.toString()) : null,
            ]);

            const context = {
                chatId,
                recentMessages: messages.slice(-5).map(formatMessage),
                totalMessages: messages.length,
                currentUser: userInfo ? {
                    username: userInfo.username,
                    displayName: userInfo.displayName,
                    isPremium: userInfo.isPremium,
                } : null,
                chatActivity: analyzeChatActivity(messages),
                timestamp: new Date().toISOString(),
            };

            return formatContextForAgent(context);
        } catch (error) {
            console.error("Error in OpenChat provider:", error);
            return `OpenChat context unavailable: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    },
};

function formatMessage(message: OpenChatMessage): string {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const sender = message.sender.slice(0, 8) + "..."; // Truncate for readability
    return `[${timestamp}] ${sender}: ${message.content}`;
}

function analyzeChatActivity(messages: OpenChatMessage[]): {
    messageFrequency: string;
    activeUsers: number;
    lastActivity: string;
} {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const recentMessages = messages.filter(m => (now - m.timestamp) < oneHour);
    const dailyMessages = messages.filter(m => (now - m.timestamp) < oneDay);
    const activeUsers = new Set(messages.map(m => m.sender)).size;
    
    let messageFrequency = "low";
    if (recentMessages.length > 10) {
        messageFrequency = "high";
    } else if (recentMessages.length > 3) {
        messageFrequency = "moderate";
    }
    
    const lastMessage = messages[messages.length - 1];
    const lastActivity = lastMessage 
        ? formatRelativeTime(now - lastMessage.timestamp)
        : "no recent activity";
    
    return {
        messageFrequency,
        activeUsers,
        lastActivity,
    };
}

function formatRelativeTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

function formatContextForAgent(context: any): string {
    return `OpenChat Context:
Chat ID: ${context.chatId}
Total Messages: ${context.totalMessages}
Message Frequency: ${context.chatActivity.messageFrequency}
Active Users: ${context.chatActivity.activeUsers}
Last Activity: ${context.chatActivity.lastActivity}

Recent Messages:
${context.recentMessages.join('\n')}

Current User: ${context.currentUser ? 
    `${context.currentUser.displayName || context.currentUser.username}${context.currentUser.isPremium ? ' (Premium)' : ''}` : 
    'Unknown'
}

Timestamp: ${context.timestamp}`;
}