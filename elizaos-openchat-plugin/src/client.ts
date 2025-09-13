import { EventEmitter } from 'events';
import { IAgentRuntime, Client, elizaLogger } from "@elizaos/core";
import { v4 as uuid } from 'uuid';
import { OpenChatService } from "./services/openchat.js";
import { OpenChatConfig, OpenChatMessage, OpenChatEvent } from "./types/index.js";

export class OpenChatClient extends EventEmitter implements Client {
    private runtime: IAgentRuntime;
    private openChatService: OpenChatService;
    private config: OpenChatConfig;
    private isConnected = false;
    private pollingInterval?: NodeJS.Timeout;
    private lastMessageTimestamp = 0;

    constructor(runtime: IAgentRuntime) {
        super();
        this.runtime = runtime;
        
        const canisterId = runtime.getSetting("OPENCHAT_CANISTER_ID");
        if (!canisterId) {
            throw new Error("OPENCHAT_CANISTER_ID is required");
        }

        this.config = {
            canisterId,
            host: runtime.getSetting("OPENCHAT_HOST") || "https://ic0.app",
            fetchRootKey: runtime.getSetting("OPENCHAT_FETCH_ROOT_KEY") === "true",
        };

        this.openChatService = new OpenChatService(this.config);
    }

    async start(): Promise<void> {
        try {
            elizaLogger.log("Starting OpenChat client...");
            
            // Test connection
            await this.testConnection();
            
            this.isConnected = true;
            elizaLogger.log("OpenChat client connected successfully");
            
            // Start polling for messages
            this.startPolling();
            
            this.emit('connected');
        } catch (error) {
            console.error("Failed to start OpenChat client:", error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        elizaLogger.log("Stopping OpenChat client...");
        
        this.isConnected = false;
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = undefined;
        }
        
        this.emit('disconnected');
        elizaLogger.log("OpenChat client stopped");
    }

    private async testConnection(): Promise<void> {
        try {
            // Try to get messages from a test chat or perform a basic operation
            // This is a placeholder - in reality, you'd test with actual OpenChat API
            elizaLogger.log("Testing OpenChat connection...");
            // await this.openChatService.getMessages("test", 0, 1);
        } catch (error) {
            throw new Error(`OpenChat connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    private startPolling(): void {
        const pollInterval = parseInt(this.runtime.getSetting("OPENCHAT_POLL_INTERVAL") || "5000");
        
        this.pollingInterval = setInterval(async () => {
            try {
                await this.pollForMessages();
            } catch (error) {
                console.error("Error polling for messages:", error);
            }
        }, pollInterval);
    }

    private async pollForMessages(): Promise<void> {
        if (!this.isConnected) return;

        try {
            // Get list of chats the agent is part of
            const chatIds = this.getMonitoredChatIds();
            
            for (const chatId of chatIds) {
                const messages = await this.openChatService.getMessages(chatId, undefined, 50);
                
                // Process new messages
                const newMessages = messages.filter(msg => msg.timestamp > this.lastMessageTimestamp);
                
                for (const message of newMessages) {
                    await this.handleMessage(message);
                }
                
                if (messages.length > 0) {
                    this.lastMessageTimestamp = Math.max(
                        this.lastMessageTimestamp,
                        Math.max(...messages.map(m => m.timestamp))
                    );
                }
            }
        } catch (error) {
            console.error("Error in message polling:", error);
        }
    }

    private getMonitoredChatIds(): string[] {
        // Get chat IDs from runtime settings or configuration
        const chatIds = this.runtime.getSetting("OPENCHAT_MONITORED_CHATS");
        if (chatIds) {
            return chatIds.split(',').map((id: string) => id.trim());
        }
        return [];
    }

    private async handleMessage(message: OpenChatMessage): Promise<void> {
        try {
            // Skip messages from the agent itself
            if (this.isOwnMessage(message)) {
                return;
            }

            elizaLogger.log(`Received OpenChat message: ${message.content.slice(0, 100)}...`);

            // Convert OpenChat message to ElizaOS Memory format
            const memory = {
                id: uuid() as `${string}-${string}-${string}-${string}-${string}`,
                userId: message.sender as `${string}-${string}-${string}-${string}-${string}`,
                agentId: this.runtime.agentId,
                content: {
                    text: message.content,
                    source: message.chatId,
                    url: `openchat://chat/${message.chatId}/message/${message.id}`,
                },
                roomId: message.chatId as `${string}-${string}-${string}-${string}-${string}`,
                createdAt: message.timestamp,
            };

            // Process the message through the runtime
            await this.runtime.processActions(
                memory,
                [],
                undefined,
                async (response) => {
                    if (response.text) {
                        await this.sendMessage(message.chatId, response.text, message.id);
                    }
                    return [];
                }
            );

            // Emit event for other handlers
            const event: OpenChatEvent = {
                type: 'message',
                data: message,
                timestamp: message.timestamp,
                chatId: message.chatId,
            };
            
            this.emit('message', event);
        } catch (error) {
            console.error("Error handling OpenChat message:", error);
        }
    }

    private isOwnMessage(message: OpenChatMessage): boolean {
        // Check if the message is from the agent itself
        const agentUserId = this.runtime.getSetting("OPENCHAT_AGENT_USER_ID");
        return !!(agentUserId && message.sender === agentUserId);
    }

    async sendMessage(chatId: string, content: string, replyToMessageId?: string): Promise<boolean> {
        try {
            const request = {
                chatId,
                content,
                repliesTo: replyToMessageId ? {
                    messageId: replyToMessageId,
                    messageIndex: 0, // This would need to be determined from the actual message
                } : undefined,
            };

            const response = await this.openChatService.sendMessage(request);
            
            if (response.success) {
                elizaLogger.log(`Sent OpenChat message to ${chatId}: ${content.slice(0, 100)}...`);
                return true;
            } else {
                console.error("Failed to send OpenChat message:", response.error || "Unknown error");
                return false;
            }
        } catch (error) {
            console.error("Error sending OpenChat message:", error);
            return false;
        }
    }

    async joinGroup(groupId: string): Promise<boolean> {
        try {
            const success = await this.openChatService.joinGroup(groupId);
            if (success) {
                elizaLogger.log(`Successfully joined OpenChat group: ${groupId}`);
                
                // Add to monitored chats
                this.addToMonitoredChats(groupId);
            }
            return success;
        } catch (error) {
            console.error("Error joining OpenChat group:", error);
            return false;
        }
    }

    async leaveGroup(groupId: string): Promise<boolean> {
        try {
            const success = await this.openChatService.leaveGroup(groupId);
            if (success) {
                elizaLogger.log(`Successfully left OpenChat group: ${groupId}`);
                
                // Remove from monitored chats
                this.removeFromMonitoredChats(groupId);
            }
            return success;
        } catch (error) {
            console.error("Error leaving OpenChat group:", error);
            return false;
        }
    }

    private addToMonitoredChats(chatId: string): void {
        const currentChats = this.getMonitoredChatIds();
        if (!currentChats.includes(chatId)) {
            currentChats.push(chatId);
            // This would need to be persisted in actual implementation
            elizaLogger.log(`Added ${chatId} to monitored chats`);
        }
    }

    private removeFromMonitoredChats(chatId: string): void {
        const currentChats = this.getMonitoredChatIds();
        const index = currentChats.indexOf(chatId);
        if (index > -1) {
            currentChats.splice(index, 1);
            // This would need to be persisted in actual implementation
            elizaLogger.log(`Removed ${chatId} from monitored chats`);
        }
    }
}