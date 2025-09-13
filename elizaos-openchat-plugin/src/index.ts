import { Plugin } from "@elizaos/core";
import { OpenChatClient } from "./client.js";
import { sendMessageAction, joinGroupAction, addReactionAction } from "./actions/index.js";
import { openChatEvaluator } from "./evaluators/index.js";
import { openChatProvider } from "./providers/index.js";

export const openChatPlugin: Plugin = {
    name: "openchat",
    description: "OpenChat integration for ElizaOS - enables AI agents to interact with OpenChat platform",
    actions: [
        sendMessageAction,
        joinGroupAction,
        addReactionAction,
    ],
    evaluators: [
        openChatEvaluator,
    ],
    providers: [
        openChatProvider,
    ],
    clients: [],
};

export default openChatPlugin;

// Re-export types and services for external use
export * from "./types/index.js";
export * from "./services/openchat.js";
export { OpenChatClient } from "./client.js";
export * from "./actions/index.js";
export * from "./evaluators/index.js";
export * from "./providers/index.js";