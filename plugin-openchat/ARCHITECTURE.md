# OpenChat Plugin Architecture

This document describes the architecture and design decisions of the OpenChat plugin for ElizaOS.

## Overview

The OpenChat plugin enables ElizaOS agents to interact with the OpenChat platform on the Internet Computer blockchain. It provides a comprehensive set of features including message sending/receiving, user/group search, real-time event processing, and more.

## Architecture Components

### 1. Core Components

```
plugin-openchat/
├── src/
│   ├── index.ts          # Main plugin entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── client.ts         # OpenChat API client
│   ├── actions.ts        # ElizaOS actions
│   ├── providers.ts      # ElizaOS providers
│   └── services.ts       # Background services
├── examples/             # Usage examples
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # Documentation
```

### 2. Client Layer (`client.ts`)

The `OpenChatClient` class serves as the main interface to the OpenChat platform:

- **HTTP Agent**: Uses `@dfinity/agent` to communicate with Internet Computer canisters
- **Candid Integration**: Handles Candid interface definitions for type-safe canister calls
- **Message Management**: Send, receive, edit, and delete messages
- **User Management**: Search users, get user information
- **Group Management**: Search, join, and leave groups
- **Error Handling**: Comprehensive error handling with custom `OpenChatError` class

```typescript
class OpenChatClient {
  private agent: HttpAgent;
  private userIndexActor: Actor;
  private groupIndexActor: Actor;
  private chatActors: Map<string, Actor>;
  
  // Core methods
  async sendMessage(chatId, content, chatType, replyTo?)
  async getMessages(chatId, chatType, startIndex?, ascending?, maxMessages?)
  async searchUsers(query, limit?)
  async searchGroups(query, limit?)
  async joinGroup(groupId)
  // ... more methods
}
```

### 3. Actions Layer (`actions.ts`)

Actions are the main way users interact with the OpenChat functionality:

- **SEND_OPENCHAT_MESSAGE**: Send messages to users or groups
- **GET_OPENCHAT_MESSAGES**: Retrieve conversation history
- **JOIN_OPENCHAT_GROUP**: Join OpenChat groups
- **SEARCH_OPENCHAT_USERS**: Find users on the platform

Each action follows the ElizaOS action pattern:
```typescript
interface Action {
  name: string;
  similes: string[];
  description: string;
  validate: (runtime, message) => Promise<boolean>;
  handler: (runtime, message, state, options, callback) => Promise<boolean>;
  examples: ActionExample[][];
}
```

### 4. Providers Layer (`providers.ts`)

Providers give the agent contextual information about OpenChat:

- **currentUserProvider**: Bot's user information
- **recentMessagesProvider**: Recent messages from active chats
- **chatInfoProvider**: List of active conversations
- **openChatStatusProvider**: Plugin configuration and status
- **userSearchProvider**: User search results
- **groupSearchProvider**: Group search results

### 5. Services Layer (`services.ts`)

The `OpenChatService` handles real-time functionality:

- **Message Polling**: Continuously polls for new messages
- **Event Processing**: Handles incoming messages, user joins/leaves, etc.
- **Rate Limiting**: Prevents spam with configurable limits
- **Auto-responses**: Generates responses to mentions and direct messages

```typescript
class OpenChatService extends Service {
  private client: OpenChatClient;
  private eventEmitter: EventEmitter;
  private pollingIntervals: Map<string, NodeJS.Timeout>;
  
  async start(): Promise<void>
  async stop(): Promise<void>
  private async pollChatForEvents(chatId, chatType): Promise<void>
  private async handleIncomingMessage(runtime, event): Promise<void>
}
```

## Data Flow

### 1. Message Sending Flow
```
User Input → Action Handler → OpenChatClient → IC Canister → OpenChat Platform
```

### 2. Message Receiving Flow
```
OpenChat Platform → IC Canister → Polling Service → Event Handler → Agent Response
```

### 3. Configuration Flow
```
Environment Variables → Plugin Config → Client Initialization → Service Setup
```

## Internet Computer Integration

### Canister Communication

The plugin communicates with several OpenChat canisters:

- **User Index Canister**: User management and search
- **Group Index Canister**: Group discovery and search  
- **Individual Chat Canisters**: Message sending/receiving
- **Notification Canister**: Real-time updates (future)

### Candid Interface

OpenChat uses Candid for type-safe inter-canister communication:

```typescript
const userIndexIDL = IDL.Service({
  'current_user': IDL.Func([], [IDL.Opt(UserRecord)], ['query']),
  'search_users': IDL.Func([IDL.Text, IDL.Nat32], [IDL.Vec(UserRecord)], ['query']),
});
```

### Identity Management

The plugin supports multiple identity types:
- Private keys
- Seed phrases  
- PEM files
- Internet Identity (future)

## Error Handling Strategy

### 1. Custom Error Types
```typescript
class OpenChatError extends Error {
  constructor(message: string, code: string, details?: any)
}
```

### 2. Error Categories
- **INITIALIZATION_ERROR**: Plugin setup failures
- **NETWORK_ERROR**: IC network connectivity issues
- **AUTHENTICATION_ERROR**: Identity/permission problems
- **RATE_LIMIT_ERROR**: Too many requests
- **VALIDATION_ERROR**: Invalid input data

### 3. Graceful Degradation
- Continue operation when non-critical features fail
- Retry mechanisms for transient failures
- Fallback behaviors for unavailable features

## Performance Considerations

### 1. Caching Strategy
- Cache canister actors to avoid recreation
- Cache user/group search results
- Cache message history for recent conversations

### 2. Rate Limiting
- Configurable limits per minute/hour
- Per-chat rate limiting
- Exponential backoff for retries

### 3. Polling Optimization
- Adaptive polling intervals based on activity
- Batch event processing
- Efficient event index tracking

## Security Considerations

### 1. Identity Protection
- Secure storage of private keys
- Environment variable configuration
- No hardcoded credentials

### 2. Input Validation
- Sanitize all user inputs
- Validate Principal IDs
- Check message length limits

### 3. Permission Checking
- Verify bot permissions before actions
- Handle permission denied gracefully
- Respect chat-level restrictions

## Extensibility

### 1. Plugin Architecture
The plugin follows ElizaOS patterns for easy extension:
- Modular action system
- Provider-based context
- Service-based background tasks

### 2. Custom Message Types
Support for extending message content types:
```typescript
interface MessageContent {
  Text?: { text: string };
  Image?: { url: string; caption?: string };
  // Extensible for new types
  Custom?: { data: Uint8Array };
}
```

### 3. Event System
Extensible event handling:
```typescript
eventEmitter.on('custom_event', handler);
```

## Testing Strategy

### 1. Unit Tests
- Individual component testing
- Mock IC agent for isolated tests
- Type safety validation

### 2. Integration Tests  
- End-to-end message flow
- Real canister communication
- Error scenario handling

### 3. Performance Tests
- Rate limiting validation
- Memory usage monitoring
- Concurrent operation testing

## Deployment Considerations

### 1. Environment Configuration
- Network selection (local/testnet/mainnet)
- Canister ID management
- Identity configuration

### 2. Monitoring
- Message success/failure rates
- Rate limit violations
- Service uptime tracking

### 3. Scaling
- Multiple agent instances
- Load balancing considerations
- Resource usage optimization

## Future Enhancements

### 1. Advanced Features
- Voice message support
- File sharing capabilities
- Poll creation and voting
- Crypto transactions

### 2. Real-time Improvements
- WebSocket connections
- Push notifications
- Instant message delivery

### 3. AI Integration
- Sentiment analysis
- Language translation
- Content moderation
- Smart replies

## Dependencies

### Core Dependencies
- `@elizaos/core`: ElizaOS framework
- `@dfinity/agent`: Internet Computer agent
- `@dfinity/principal`: Principal ID handling
- `@dfinity/candid`: Candid interface support

### Optional Dependencies
- `ws`: WebSocket support (future)
- `node-fetch`: HTTP requests
- Various TypeScript types

This architecture provides a solid foundation for OpenChat integration while maintaining flexibility for future enhancements and customizations.