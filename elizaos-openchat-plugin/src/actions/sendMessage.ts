import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    Content,
    ActionExample,
} from "@elizaos/core";
import { OpenChatService } from "../services/openchat.js";
import { SendMessageRequest, MessageType } from "../types/index.js";

export const sendMessageAction: Action = {
    name: "SEND_OPENCHAT_MESSAGE",
    similes: [
        "SEND_MESSAGE",
        "REPLY",
        "RESPOND",
        "SAY",
        "TELL",
        "COMMUNICATE",
        "CHAT",
    ],
    description: "Send a message to an OpenChat channel or group",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const openChatConfig = runtime.getSetting("OPENCHAT_CANISTER_ID");
        return !!openChatConfig;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        try {
            const canisterId = runtime.getSetting("OPENCHAT_CANISTER_ID");
            const host = runtime.getSetting("OPENCHAT_HOST") || "https://ic0.app";
            
            if (!canisterId) {
                throw new Error("OpenChat canister ID not configured");
            }

            const openChatService = new OpenChatService({
                canisterId,
                host,
                fetchRootKey: runtime.getSetting("OPENCHAT_FETCH_ROOT_KEY") === "true",
            });

            const chatId = (state as any)?.chatId || message.content.source;
            const content = message.content.text;
            
            if (!chatId) {
                throw new Error("No chat ID specified");
            }

            if (!content) {
                throw new Error("No message content provided");
            }

            const request: SendMessageRequest = {
                chatId,
                content,
                messageType: MessageType.Text,
            };

            // Check if this is a reply
            if (state?.repliesTo) {
                request.repliesTo = {
                    messageId: (state.repliesTo as any).messageId,
                    messageIndex: (state.repliesTo as any).messageIndex,
                };
            }

            const response = await openChatService.sendMessage(request);

            if (response.success) {
                const responseMessage: Content = {
                    text: `Message sent successfully to OpenChat${response.messageId ? ` (ID: ${response.messageId})` : ''}`,
                    source: chatId,
                    inReplyTo: message.id,
                };

                callback?.(responseMessage);
                return true;
            } else {
                throw new Error(response.error || "Failed to send message");
            }
        } catch (error) {
            const errorMessage: Content = {
                text: `Failed to send OpenChat message: ${error instanceof Error ? error.message : "Unknown error"}`,
                source: message.content.source || undefined,
                inReplyTo: message.id,
            };

            callback?.(errorMessage);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send a message to the general channel saying hello",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll send a hello message to the general channel on OpenChat.",
                    action: "SEND_OPENCHAT_MESSAGE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Reply to that message with thanks",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll reply to the message with thanks.",
                    action: "SEND_OPENCHAT_MESSAGE",
                },
            },
        ],
    ] as ActionExample[][],
};