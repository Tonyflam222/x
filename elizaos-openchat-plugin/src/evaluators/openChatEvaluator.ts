import {
    Evaluator,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { OpenChatService } from "../services/openchat.js";

export const openChatEvaluator: Evaluator = {
    name: "OPENCHAT_CONTEXT",
    similes: [
        "OPENCHAT_ANALYSIS",
        "CHAT_CONTEXT",
        "MESSAGE_ANALYSIS",
        "CONVERSATION_STATE",
    ],
    description: "Evaluates OpenChat message context and conversation state",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const openChatConfig = runtime.getSetting("OPENCHAT_CANISTER_ID");
        return !!(openChatConfig && message.content.source?.includes("openchat"));
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const canisterId = runtime.getSetting("OPENCHAT_CANISTER_ID");
            const host = runtime.getSetting("OPENCHAT_HOST") || "https://ic0.app";
            
            if (!canisterId) {
                return [];
            }

            const openChatService = new OpenChatService({
                canisterId,
                host,
                fetchRootKey: runtime.getSetting("OPENCHAT_FETCH_ROOT_KEY") === "true",
            });

            const chatId = message.content.source;
            if (!chatId) {
                return [];
            }

            // Get recent messages for context
            const recentMessages = await openChatService.getMessages(chatId, undefined, 10);
            
            // Analyze conversation patterns
            const analysis = analyzeConversation(recentMessages, message);
            
            return [
                {
                    id: `openchat-context-${message.id}`,
                    userId: message.userId,
                    agentId: message.agentId,
                    content: {
                        text: analysis.summary,
                        metadata: {
                            messageCount: analysis.messageCount,
                            activeUsers: analysis.activeUsers,
                            sentiment: analysis.sentiment,
                            topics: analysis.topics,
                            lastActivity: analysis.lastActivity,
                        },
                    },
                    roomId: message.roomId,
                    createdAt: Date.now(),
                },
            ];
        } catch (error) {
            console.error("Error in OpenChat evaluator:", error);
            return [];
        }
    },
    examples: [
        {
            context: "User sends a message in an OpenChat group",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Hey everyone, how's the project going?",
                        source: "openchat-group-123",
                    },
                },
            ],
            outcome: "Evaluates the message context, recent conversation history, and provides analysis of the group's activity and sentiment.",
        },
        {
            context: "Multiple users are discussing a topic in OpenChat",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I think we should implement the new feature",
                        source: "openchat-channel-456",
                    },
                },
                {
                    user: "{{user2}}",
                    content: {
                        text: "Great idea! When can we start?",
                        source: "openchat-channel-456",
                    },
                },
            ],
            outcome: "Analyzes the ongoing discussion, identifies the topic (feature implementation), and tracks participant engagement.",
        },
    ],
};

interface ConversationAnalysis {
    summary: string;
    messageCount: number;
    activeUsers: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    lastActivity: number;
}

function analyzeConversation(messages: any[], currentMessage: Memory): ConversationAnalysis {
    const activeUsers = new Set<string>();
    const topics = new Set<string>();
    let positiveWords = 0;
    let negativeWords = 0;
    
    // Simple sentiment analysis keywords
    const positiveKeywords = ['good', 'great', 'awesome', 'excellent', 'love', 'like', 'happy', 'yes', 'perfect', 'amazing'];
    const negativeKeywords = ['bad', 'terrible', 'hate', 'dislike', 'no', 'wrong', 'awful', 'horrible', 'sad', 'angry'];
    
    // Simple topic extraction keywords
    const topicKeywords = ['project', 'feature', 'bug', 'update', 'release', 'meeting', 'deadline', 'task', 'issue', 'proposal'];
    
    messages.forEach(msg => {
        activeUsers.add(msg.sender);
        
        const text = msg.content?.toLowerCase() || '';
        
        // Sentiment analysis
        positiveKeywords.forEach(word => {
            if (text.includes(word)) positiveWords++;
        });
        
        negativeKeywords.forEach(word => {
            if (text.includes(word)) negativeWords++;
        });
        
        // Topic extraction
        topicKeywords.forEach(topic => {
            if (text.includes(topic)) topics.add(topic);
        });
    });
    
    // Determine sentiment
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveWords > negativeWords) {
        sentiment = 'positive';
    } else if (negativeWords > positiveWords) {
        sentiment = 'negative';
    }
    
    const lastActivity = messages.length > 0 ? Math.max(...messages.map(m => m.timestamp)) : Date.now();
    
    return {
        summary: `Conversation analysis: ${messages.length} recent messages from ${activeUsers.size} users. Sentiment: ${sentiment}. Active topics: ${Array.from(topics).join(', ') || 'general discussion'}.`,
        messageCount: messages.length,
        activeUsers: Array.from(activeUsers),
        sentiment,
        topics: Array.from(topics),
        lastActivity,
    };
}