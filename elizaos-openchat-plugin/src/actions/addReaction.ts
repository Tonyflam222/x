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

export const addReactionAction: Action = {
    name: "ADD_OPENCHAT_REACTION",
    similes: [
        "ADD_REACTION",
        "REACT",
        "EMOJI",
        "LIKE",
        "HEART",
        "THUMBS_UP",
        "CELEBRATE",
    ],
    description: "Add a reaction emoji to an OpenChat message",
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

            const chatId = (state as any)?.chatId || message.content.source || "";
            const messageId = (state as any)?.messageId || "";
            const reaction = (state as any)?.reaction || extractReactionFromText(message.content.text || "");
            
            if (!chatId) {
                throw new Error("No chat ID specified");
            }

            if (!messageId) {
                throw new Error("No message ID specified");
            }

            if (!reaction) {
                throw new Error("No reaction specified");
            }

            const success = await openChatService.addReaction(chatId, messageId, reaction);

            if (success) {
                const responseMessage: Content = {
                    text: `Added reaction ${reaction} to message in OpenChat`,
                    source: chatId || undefined,
                    inReplyTo: message.id,
                };

                callback?.(responseMessage);
                return true;
            } else {
                throw new Error("Failed to add reaction");
            }
        } catch (error) {
            const errorMessage: Content = {
                text: `Failed to add OpenChat reaction: ${error instanceof Error ? error.message : "Unknown error"}`,
                source: message.content.source,
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
                    text: "Add a thumbs up reaction to that message",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll add a thumbs up reaction to the message.",
                    action: "ADD_OPENCHAT_REACTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "React with 🎉 to celebrate",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll add a celebration emoji reaction.",
                    action: "ADD_OPENCHAT_REACTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Like that message",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll add a like reaction to the message.",
                    action: "ADD_OPENCHAT_REACTION",
                },
            },
        ],
    ] as ActionExample[][],
};

function extractReactionFromText(text: string): string | null {
    // Common emoji patterns
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiMatch = text.match(emojiPattern);
    if (emojiMatch) {
        return emojiMatch[0];
    }

    // Text-based reactions
    const textReactions: { [key: string]: string } = {
        'thumbs up': '👍',
        'thumbs_up': '👍',
        'like': '👍',
        'heart': '❤️',
        'love': '❤️',
        'laugh': '😂',
        'lol': '😂',
        'sad': '😢',
        'angry': '😠',
        'celebrate': '🎉',
        'party': '🎉',
        'fire': '🔥',
        'clap': '👏',
        'ok': '👌',
        'check': '✅',
        'cross': '❌',
        'no': '❌',
    };

    const lowerText = text.toLowerCase();
    for (const [key, emoji] of Object.entries(textReactions)) {
        if (lowerText.includes(key)) {
            return emoji;
        }
    }

    return null;
}