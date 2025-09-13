# @elizaos/plugin-openchat

A comprehensive OpenChat integration plugin for ElizaOS agents that enables full interaction with the OpenChat platform running on the Internet Computer blockchain.

## Features

- **Send Messages**: Send text messages to OpenChat groups and channels
- **Receive Messages**: Listen for and process incoming messages in real-time
- **Group Management**: Join and leave OpenChat groups
- **Message Retrieval**: Fetch message history from chats
- **Group Discovery**: List and browse available public groups
- **Real-time Events**: Subscribe to OpenChat events (messages, joins, reactions)
- **Multi-format Support**: Handle text, images, videos, files, and polls
- **User Management**: Get user information and manage relationships
- **Thread Support**: Send and receive threaded messages
- **Reaction Support**: Add and remove reactions to messages

## Installation

```bash
npm install @elizaos/plugin-openchat
# or
pnpm install @elizaos/plugin-openchat
# or
yarn add @elizaos/plugin-openchat
```

## Configuration

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Required: OpenChat canister ID
OPENCHAT_CANISTER_ID=6hsbt-vqaaa-aaaaf-aaafq-cai

# Optional: Environment (local or ic)
OPENCHAT_ENVIRONMENT=ic

# Optional: Custom IC host
OPENCHAT_HOST=https://ic0.app

# Optional: Private key for identity (hex format)
OPENCHAT_PRIVATE_KEY=your_private_key_here

# Optional: Identity provider
OPENCHAT_IDENTITY_PROVIDER=https://identity.ic0.app

# Optional: User principal ID
OPENCHAT_USER_PRINCIPAL=your_principal_id_here

# Optional: Default chat ID for the agent
OPENCHAT_DEFAULT_CHAT_ID=your_default_chat_id_here
```

### Character Configuration

Add the plugin to your character's configuration:

```json
{
  "name": "OpenChatBot",
  "plugins": ["@elizaos/plugin-openchat"],
  "settings": {
    "OPENCHAT_CANISTER_ID": "6hsbt-vqaaa-aaaaf-aaafq-cai",
    "OPENCHAT_DEFAULT_CHAT_ID": "your_default_chat_id_here"
  }
}
```

## Usage

### Basic Setup

```typescript
import { openChatPlugin } from '@elizaos/plugin-openchat';

// Add to your agent's plugins
const agent = new Agent({
  character: {
    name: "OpenChatBot",
    plugins: [openChatPlugin]
  }
});
```

### Available Actions

The plugin provides several actions that your agent can perform:

#### 1. Send Message (`SEND_OPENCHAT_MESSAGE`)
Send messages to OpenChat groups or channels.

**Example user prompts:**
- "Send a message to the main chat saying hello everyone!"
- "Post an update about the project in the developers channel"
- "Reply to that message with thanks"

#### 2. Join Group (`JOIN_OPENCHAT_GROUP`)
Join OpenChat groups or channels.

**Example user prompts:**
- "Join the developers group on OpenChat"
- "Enter the gaming channel"
- "Join the group with ID xyz123"

#### 3. Get Messages (`GET_OPENCHAT_MESSAGES`)
Retrieve message history from chats.

**Example user prompts:**
- "Get the latest messages from the main chat"
- "Show me recent messages from the developers group"
- "Fetch the last 20 messages"

#### 4. List Groups (`LIST_OPENCHAT_GROUPS`)
Browse available public groups.

**Example user prompts:**
- "Show me all available OpenChat groups"
- "List public groups I can join"
- "Find groups about blockchain"

### Providers

The plugin includes several providers that give your agent context about OpenChat:

- **`openChatMessagesProvider`**: Provides recent messages from the default chat
- **`openChatUserProvider`**: Provides current user information
- **`openChatGroupsProvider`**: Provides available groups information
- **`openChatContextProvider`**: Provides overall OpenChat context

### Service Integration

The OpenChat service runs in the background and handles:

- Real-time message processing
- Event subscription and handling
- Connection management
- Health monitoring

```typescript
import { getOpenChatService, sendQuickMessage } from '@elizaos/plugin-openchat';

// Get the service instance
const service = getOpenChatService(runtime);

// Send a quick message
await sendQuickMessage(runtime, 'chat_id_here', 'Hello OpenChat!');

// Check service health
const isHealthy = await service.isHealthy();
```

## API Reference

### OpenChatClient

The core client for interacting with OpenChat:

```typescript
import { OpenChatClient } from '@elizaos/plugin-openchat';

const client = new OpenChatClient({
  canisterId: 'your_canister_id',
  environment: 'ic'
});

// Send a message
await client.sendMessage({
  chatId: Principal.fromText('chat_id'),
  messageId: client.generateMessageId(),
  content: { text: 'Hello!' },
  correlationId: client.generateCorrelationId()
});

// Get messages
const messages = await client.getMessages(
  Principal.fromText('chat_id'),
  undefined, // fromIndex
  false,     // ascending
  10         // maxResults
);

// Join a group
await client.joinGroup(Principal.fromText('group_id'));

// Subscribe to events
await client.subscribeToEvents((event) => {
  console.log('OpenChat event:', event);
});
```

### Types

```typescript
interface OpenChatMessage {
  messageId: bigint;
  sender: Principal;
  content: MessageContent;
  timestamp: bigint;
  threadRootMessageIndex?: number;
  forwarded?: boolean;
  edited?: boolean;
}

interface MessageContent {
  text?: string;
  image?: ImageContent;
  video?: VideoContent;
  audio?: AudioContent;
  file?: FileContent;
  poll?: PollContent;
  crypto?: CryptoContent;
}

interface OpenChatGroup {
  chatId: Principal;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
  permissions: GroupPermissions;
}
```

## Advanced Usage

### Custom Event Handling

```typescript
import { OpenChatService } from '@elizaos/plugin-openchat';

class CustomOpenChatService extends OpenChatService {
  protected async handleEvent(event: OpenChatEvent): Promise<void> {
    // Custom event handling logic
    if (event.type === 'message') {
      console.log(`New message: ${event.content?.text}`);
    }
    
    // Call parent handler
    await super.handleEvent(event);
  }
}
```

### Multi-Chat Management

```typescript
// Configure multiple default chats
runtime.setSetting('OPENCHAT_MAIN_CHAT', 'main_chat_id');
runtime.setSetting('OPENCHAT_DEV_CHAT', 'dev_chat_id');
runtime.setSetting('OPENCHAT_SUPPORT_CHAT', 'support_chat_id');

// Use different chats for different purposes
await sendQuickMessage(runtime, runtime.getSetting('OPENCHAT_DEV_CHAT'), 'Development update');
await sendQuickMessage(runtime, runtime.getSetting('OPENCHAT_SUPPORT_CHAT'), 'Support response');
```

### Message Filtering and Processing

```typescript
const service = getOpenChatService(runtime);

// Get and filter messages
const messages = await service.getRecentMessages('chat_id', 50);
const importantMessages = messages.filter(msg => 
  msg.text?.includes('@everyone') || msg.text?.includes('urgent')
);

// Process each message
for (const message of importantMessages) {
  await processImportantMessage(message);
}
```

## Error Handling

The plugin includes comprehensive error handling:

```typescript
try {
  await client.sendMessage(messageArgs);
} catch (error) {
  if (error.message.includes('not_authorized')) {
    console.error('Not authorized to send message');
  } else if (error.message.includes('chat_not_found')) {
    console.error('Chat not found');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Security Considerations

1. **Private Keys**: Store private keys securely using environment variables
2. **Principal IDs**: Validate principal IDs before use
3. **Message Content**: Sanitize user input before sending messages
4. **Rate Limiting**: Implement rate limiting for message sending
5. **Access Control**: Verify permissions before performing actions

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check your canister ID is correct
   - Verify network connectivity to Internet Computer
   - Ensure proper identity configuration

2. **Authentication Error**
   - Verify your private key or identity provider
   - Check if your principal has necessary permissions
   - Ensure you're using the correct environment (local/ic)

3. **Message Send Failed**
   - Check if you're a member of the target group
   - Verify the chat ID is correct
   - Ensure the message content is valid

4. **No Messages Received**
   - Check WebSocket connection
   - Verify event subscription is active
   - Ensure proper chat permissions

### Debug Mode

Enable debug logging:

```typescript
import { elizaLogger } from '@elizaos/core';

elizaLogger.setLevel('debug');
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [OpenChat Documentation](https://docs.openchat.app)
- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [ElizaOS Documentation](https://docs.elizaos.ai)
- [GitHub Issues](https://github.com/elizaOS/eliza/issues)

## Examples

See the [examples](examples/) directory for complete implementation examples:

- Basic chat bot
- Group moderator bot
- Multi-chat manager
- Event processor
- Custom message handlers