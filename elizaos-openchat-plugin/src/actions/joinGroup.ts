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

export const joinGroupAction: Action = {
    name: "JOIN_OPENCHAT_GROUP",
    similes: [
        "JOIN_GROUP",
        "JOIN_CHANNEL",
        "ENTER_GROUP",
        "PARTICIPATE",
        "BECOME_MEMBER",
    ],
    description: "Join an OpenChat group or channel",
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

            // Extract group ID from message content or state
            const groupId = (state as any)?.groupId || extractGroupIdFromText(message.content.text || "");
            
            if (!groupId) {
                throw new Error("No group ID specified");
            }

            const success = await openChatService.joinGroup(groupId);

            if (success) {
                const responseMessage: Content = {
                    text: `Successfully joined OpenChat group: ${groupId}`,
                    source: message.content.source,
                    inReplyTo: message.id,
                };

                callback?.(responseMessage);
                return true;
            } else {
                throw new Error("Failed to join group");
            }
        } catch (error) {
            const errorMessage: Content = {
                text: `Failed to join OpenChat group: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    text: "Join the crypto-discussion group",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll join the crypto-discussion group on OpenChat.",
                    action: "JOIN_OPENCHAT_GROUP",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you join group ID abc123?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll join the group with ID abc123.",
                    action: "JOIN_OPENCHAT_GROUP",
                },
            },
        ],
    ] as ActionExample[][],
};

function extractGroupIdFromText(text: string): string | null {
    // Try to extract group ID from various formats
    const patterns = [
        /group\s+(?:id\s+)?([a-zA-Z0-9\-_]+)/i,
        /join\s+([a-zA-Z0-9\-_]+)/i,
        /([a-zA-Z0-9\-_]{8,})/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}