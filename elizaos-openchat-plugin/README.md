# @elizaos/plugin-openchat

A comprehensive OpenChat integration plugin for ElizaOS that enables AI agents to interact seamlessly with the OpenChat platform on the Internet Computer.

## Features

- **Message Handling**: Send and receive messages in OpenChat channels and groups
- **Group Management**: Join and leave OpenChat groups programmatically
- **Reactions**: Add and remove emoji reactions to messages
- **Real-time Monitoring**: Poll for new messages and events
- **Context Awareness**: Analyze conversation history and provide contextual responses
- **Multi-chat Support**: Monitor and interact with multiple chats simultaneously

## Installation

```bash
npm install @elizaos/plugin-openchat
```

## Configuration

Set the following environment variables:

```bash
# Required
OPENCHAT_CANISTER_ID=your_openchat_canister_id

# Optional
OPENCHAT_HOST=https://ic0.app
OPENCHAT_FETCH_ROOT_KEY=false
OPENCHAT_POLL_INTERVAL=5000
OPENCHAT_MONITORED_CHATS=chat1,chat2,chat3
OPENCHAT_AGENT_USER_ID=your_agent_user_id
```

## Usage

### Basic Setup

```typescript
import { openChatPlugin } from '@elizaos/plugin-openchat';

// Add to your ElizaOS configuration
const plugins = [
    openChatPlugin,
    // ... other plugins
];
```

### Character Configuration

```typescript
import { Character } from '@elizaos/core';
import { openChatPlugin } from '@elizaos/plugin-openchat';

const character: Character = {
    name: "OpenChatBot",
    plugins: [openChatPlugin],
    settings: {
        secrets: {
            OPENCHAT_CANISTER_ID: "your_canister_id",
        }
    },
    // ... other character configuration
};
```

## Actions

### Send Message

Send messages to OpenChat channels or groups:

```typescript
// The agent can respond to commands like:
// "Send a message to the general channel saying hello"
// "Reply to that message with thanks"
```

### Join Group

Join OpenChat groups:

```typescript
// The agent can respond to commands like:
// "Join the crypto-discussion group"
// "Can you join group ID abc123?"
```

### Add Reaction

Add emoji reactions to messages:

```typescript
// The agent can respond to commands like:
// "Add a thumbs up reaction to that message"
// "React with 🎉 to celebrate"
// "Like that message"
```

## Providers

### OpenChat Context Provider

Provides rich context about OpenChat conversations:

- Recent message history
- Chat activity analysis
- User information
- Message frequency and sentiment analysis

## Evaluators

### OpenChat Context Evaluator

Analyzes OpenChat messages and conversation patterns:

- Sentiment analysis
- Topic extraction
- User engagement tracking
- Conversation flow analysis

## Client

### OpenChatClient

The main client class that handles:

- Connection to OpenChat canisters
- Message polling and event handling
- Real-time message processing
- Group management
- Error handling and reconnection

## API Reference

### OpenChatService

Core service for interacting with OpenChat:

```typescript
class OpenChatService {
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>
    async getMessages(chatId: string, fromIndex?: number, limit?: number): Promise<OpenChatMessage[]>
    async getUser(userId: string): Promise<OpenChatUser | null>
    async joinGroup(groupId: string): Promise<boolean>
    async leaveGroup(groupId: string): Promise<boolean>
    async addReaction(chatId: string, messageId: string, reaction: string): Promise<boolean>
    async removeReaction(chatId: string, messageId: string, reaction: string): Promise<boolean>
    async deleteMessage(chatId: string, messageId: string): Promise<boolean>
    async editMessage(chatId: string, messageId: string, newContent: string): Promise<boolean>
    async markAsRead(chatId: string, messageId: string): Promise<boolean>
}
```

### Types

Key TypeScript interfaces:

```typescript
interface OpenChatMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: number;
    messageType: MessageType;
    chatId: string;
    threadRootMessageIndex?: number;
    repliesTo?: ReplyContext;
    reactions?: Reaction[];
    edited?: boolean;
    forwarded?: boolean;
}

interface OpenChatConfig {
    canisterId: string;
    identity?: string;
    host?: string;
    fetchRootKey?: boolean;
}

interface SendMessageRequest {
    chatId: string;
    content: string;
    messageType?: MessageType;
    repliesTo?: ReplyContext;
    threadRootMessageIndex?: number;
    forwardingMessages?: string[];
}
```

## How It Works

### Architecture Overview

1. **Client Layer**: `OpenChatClient` manages connections and real-time communication
2. **Service Layer**: `OpenChatService` handles direct API interactions with OpenChat canisters
3. **Action Layer**: Predefined actions for common operations (send message, join group, etc.)
4. **Provider Layer**: Context providers for conversation analysis
5. **Evaluator Layer**: Message and conversation evaluators for intelligent responses

### Message Flow

1. **Incoming Messages**:
   - Client polls OpenChat for new messages
   - Messages are converted to ElizaOS Memory format
   - Runtime processes messages through evaluators and providers
   - Appropriate actions are triggered based on message content

2. **Outgoing Messages**:
   - Actions are triggered by user commands or agent decisions
   - Service layer sends messages through OpenChat API
   - Success/failure is tracked and reported

### Integration with Internet Computer

The plugin leverages the Internet Computer's unique features:

- **Decentralized Infrastructure**: Direct integration with OpenChat canisters
- **Candid Interface**: Type-safe communication using Candid IDL
- **Identity Management**: Secure authentication using Internet Computer identities
- **Real-time Updates**: Efficient polling mechanism for message updates

## Advanced Usage

### Custom Message Handlers

```typescript
client.on('message', (event: OpenChatEvent) => {
    // Custom message handling logic
    console.log('Received message:', event.data);
});
```

### Multi-Agent Coordination

```typescript
// Configure multiple agents for different chats
const agents = [
    { chatId: 'general', agent: generalAgent },
    { chatId: 'tech-support', agent: supportAgent },
    { chatId: 'community', agent: communityAgent },
];
```

### Error Handling

```typescript
client.on('error', (error) => {
    console.error('OpenChat error:', error);
    // Implement retry logic or fallback behavior
});
```

## Troubleshooting

### Common Issues

1. **Connection Failures**:
   - Verify `OPENCHAT_CANISTER_ID` is correct
   - Check Internet Computer network status
   - Ensure proper identity configuration

2. **Message Polling Issues**:
   - Adjust `OPENCHAT_POLL_INTERVAL` for your use case
   - Monitor rate limits and API quotas
   - Check chat permissions

3. **Authentication Problems**:
   - Verify identity has proper permissions
   - Check canister access controls
   - Ensure correct host configuration

### Debug Mode

Enable debug logging:

```bash
DEBUG=elizaos:openchat npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:

- GitHub Issues: [Report bugs or request features]
- Discord: [Join the ElizaOS community]
- Documentation: [Visit docs.elizaos.ai]

## Roadmap

- [ ] Voice message support
- [ ] File upload/download
- [ ] Advanced group management
- [ ] Governance proposal integration
- [ ] Cross-chain messaging
- [ ] Analytics dashboard
- [ ] Mobile notifications
- [ ] Webhook support