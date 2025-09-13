# @elizaos/plugin-openchat

A comprehensive OpenChat plugin for ElizaOS agents, enabling seamless interaction with the OpenChat platform on the Internet Computer blockchain.

## Features

- **Send and receive messages** in direct chats and group conversations
- **Real-time message polling** for responsive interactions
- **User and group search** functionality
- **Automatic group joining** and management
- **Rate limiting** to prevent spam
- **Mention detection** in group chats
- **Rich message content support** (text, images, files, etc.)
- **Event handling** for user joins/leaves and message edits
- **Configurable bot behavior** and permissions

## Installation

```bash
npm install @elizaos/plugin-openchat
# or
pnpm add @elizaos/plugin-openchat
```

## Configuration

Create a configuration object with your OpenChat settings:

```typescript
import { createOpenChatConfig } from '@elizaos/plugin-openchat';

const openChatConfig = createOpenChatConfig({
  network: 'mainnet', // 'local', 'testnet', or 'mainnet'
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
    username: 'my_eliza_bot',
    displayName: 'Eliza AI Assistant',
    bio: 'An AI assistant powered by ElizaOS',
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
```

## Usage

### Basic Setup

```typescript
import { openChatPlugin } from '@elizaos/plugin-openchat';

// Add to your ElizaOS character configuration
const character = {
  name: "MyBot",
  plugins: [openChatPlugin],
  settings: {
    OPENCHAT_CONFIG: openChatConfig,
  },
  // ... other character settings
};
```

### Environment Variables

You can also configure the plugin using environment variables:

```bash
# Required
OPENCHAT_USER_INDEX_CANISTER=rdmx6-jaaaa-aaaah-qcaiq-cai
OPENCHAT_GROUP_INDEX_CANISTER=bkyz2-fmaaa-aaaah-qcaiq-cai
OPENCHAT_BOT_USERNAME=my_eliza_bot

# Optional
OPENCHAT_NETWORK=mainnet
OPENCHAT_BOT_DISPLAY_NAME="Eliza AI Assistant"
OPENCHAT_BOT_BIO="An AI assistant powered by ElizaOS"
OPENCHAT_AUTO_JOIN_GROUPS=false
OPENCHAT_RESPOND_TO_DMS=true
OPENCHAT_RESPOND_TO_MENTIONS=true
OPENCHAT_MAX_MESSAGE_LENGTH=1000
OPENCHAT_RATE_LIMIT_PER_MINUTE=10
OPENCHAT_RATE_LIMIT_PER_HOUR=100
```

## Actions

The plugin provides several actions that can be triggered by user commands:

### SEND_OPENCHAT_MESSAGE
Send a message to an OpenChat user or group.

**Example usage:**
- "Send a message to OpenChat user rdmx6-jaaaa-aaaah-qcaiq-cai saying 'Hello!'"
- "Message the OpenChat group bkyz2-fmaaa-aaaah-qcaiq-cai with 'The bot is online!'"

### GET_OPENCHAT_MESSAGES
Retrieve recent messages from an OpenChat conversation.

**Example usage:**
- "Get the latest messages from OpenChat user rdmx6-jaaaa-aaaah-qcaiq-cai"
- "Show me recent messages from the group chat"

### JOIN_OPENCHAT_GROUP
Join an OpenChat group.

**Example usage:**
- "Join the OpenChat group bkyz2-fmaaa-aaaah-qcaiq-cai"

### SEARCH_OPENCHAT_USERS
Search for users on the OpenChat platform.

**Example usage:**
- "Search for OpenChat users with username containing 'alice'"
- "Find users named 'bob' on OpenChat"

## Providers

The plugin includes several providers that give your agent context about OpenChat:

- **currentUserProvider**: Information about the bot's OpenChat user
- **recentMessagesProvider**: Recent messages from active conversations
- **chatInfoProvider**: List of active direct and group chats
- **openChatStatusProvider**: Plugin configuration and status
- **userSearchProvider**: Search results for OpenChat users
- **groupSearchProvider**: Search results for OpenChat groups

## Services

The `OpenChatService` handles real-time message polling and event processing:

- Polls direct messages and group chats for new messages
- Handles incoming messages and generates appropriate responses
- Manages rate limiting to prevent spam
- Processes user joins/leaves and other chat events
- Supports mention detection in group chats

## API Reference

### OpenChatClient

The main client for interacting with OpenChat:

```typescript
import { OpenChatClient } from '@elizaos/plugin-openchat';

const client = new OpenChatClient(config);

// Send a message
await client.sendMessage(chatId, 'Hello!', 'direct');

// Get messages
const messages = await client.getMessages(chatId, 'direct');

// Search users
const users = await client.searchUsers('alice');

// Join a group
await client.joinGroup(groupId);
```

### Types

Key types used throughout the plugin:

```typescript
interface OpenChatMessage {
  messageId: bigint;
  messageIndex: number;
  sender: Principal;
  content: MessageContent;
  timestamp: bigint;
  edited?: boolean;
  forwarded?: boolean;
  repliesTo?: { messageIndex: number };
}

interface ChatSummary {
  chatId: Principal;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
  lastMessage?: OpenChatMessage;
  permissions: ChatPermissions;
}
```

## OpenChat Canister IDs

For mainnet, you'll need the current OpenChat canister IDs. These can be found in the OpenChat documentation or by checking the OpenChat frontend source code.

Common mainnet canister IDs (verify these are current):
- User Index: `rdmx6-jaaaa-aaaah-qcaiq-cai`
- Group Index: `bkyz2-fmaaa-aaaah-qcaiq-cai`
- Notifications: `iywa7-ayaaa-aaaah-qcaiq-cai`

## Authentication

The plugin supports several authentication methods:

1. **Private Key**: Provide a private key directly
2. **Seed Phrase**: Use a mnemonic seed phrase
3. **PEM File**: Load identity from a PEM file

```typescript
const config = createOpenChatConfig({
  // ... other config
  identity: {
    privateKey: 'your-private-key-here',
    // or
    seedPhrase: 'your twelve word seed phrase here',
    // or
    pemFile: '/path/to/identity.pem',
  },
});
```

## Rate Limiting

The plugin includes built-in rate limiting to prevent spam:

```typescript
const config = createOpenChatConfig({
  // ... other config
  rateLimits: {
    messagesPerMinute: 10,    // Max 10 messages per minute
    messagesPerHour: 100,     // Max 100 messages per hour
    maxConcurrentChats: 50,   // Max 50 concurrent conversations
  },
});
```

## Error Handling

The plugin includes comprehensive error handling:

```typescript
import { OpenChatError } from '@elizaos/plugin-openchat';

try {
  await client.sendMessage(chatId, message);
} catch (error) {
  if (error instanceof OpenChatError) {
    console.error(`OpenChat error (${error.code}):`, error.message);
    console.error('Details:', error.details);
  }
}
```

## Development

To develop or contribute to this plugin:

```bash
# Clone the repository
git clone <repository-url>
cd plugin-openchat

# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run in development mode
pnpm dev
```

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.

## License

MIT License - see LICENSE file for details.

## Support

For support, please:
1. Check the ElizaOS documentation
2. Review the OpenChat documentation
3. Open an issue on GitHub
4. Join the ElizaOS community discussions

## Changelog

### 1.0.0
- Initial release
- Full OpenChat integration
- Real-time message polling
- User and group search
- Rate limiting
- Comprehensive error handling