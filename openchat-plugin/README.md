# OpenChat Plugin for ElizaOS

A comprehensive plugin that enables ElizaOS AI agents to interact seamlessly with OpenChat, a decentralized chat application running on the Internet Computer blockchain.

## Features

### 🚀 Core Capabilities

- **Bidirectional Communication**: Incoming messages from OpenChat are processed by ElizaOS agents, and outgoing responses are sent back through the bot
- **Real-time Event Handling**: Listen to message events, member events, and chat detail events
- **Multi-media Support**: Send text, images, videos, audio files, documents, polls, and GIFs
- **Channel Management**: Create and delete channels with customizable permissions
- **Member Management**: Invite and remove members from channels and groups
- **Chat Information**: Retrieve detailed information about chats, including permissions and member counts

### 📋 Available Actions

- `SEND_MESSAGE_OPENCHAT` - Send text messages
- `SEND_IMAGE_OPENCHAT` - Send images with optional captions
- `SEND_FILE_OPENCHAT` - Send files and documents
- `CREATE_CHANNEL_OPENCHAT` - Create new channels
- `DELETE_CHANNEL_OPENCHAT` - Delete existing channels
- `INVITE_MEMBERS_OPENCHAT` - Invite users to channels
- `REMOVE_MEMBERS_OPENCHAT` - Remove users from channels
- `GET_CHAT_DETAILS_OPENCHAT` - Get detailed chat information

### 🔄 Event Processing

The plugin automatically handles:
- **Message Events**: Process incoming messages and generate responses
- **Member Events**: Handle user joins and leaves
- **Channel Events**: Monitor channel creation and deletion
- **User Events**: Track user invitations and removals

## Installation

```bash
npm install @elizaos/plugin-openchat
```

## Configuration

### Environment Variables

Set the following environment variables in your ElizaOS project:

```env
# Required
OPENCHAT_BOT_ID=your_bot_id
OPENCHAT_API_ENDPOINT=https://your-openchat-api.com
OPENCHAT_BOT_NAME=YourBotName

# Optional
OPENCHAT_WEBHOOK_URL=wss://your-webhook-url.com
OPENCHAT_API_KEY=your_api_key
OPENCHAT_PRINCIPAL=your_principal_id
```

### Character Configuration

Add the plugin to your character's configuration:

```typescript
export const character: Character = {
  name: 'YourAgent',
  plugins: [
    '@elizaos/plugin-openchat',
    // ... other plugins
  ],
  // ... other configuration
};
```

## Usage Examples

### Sending Messages

```typescript
// The agent will automatically respond to incoming messages
// You can also trigger message sending through actions:

{
  action: 'SEND_MESSAGE_OPENCHAT',
  content: {
    chatId: 'general',
    text: 'Hello everyone! 👋',
    replyTo: 'optional_message_id'
  }
}
```

### Sending Media

```typescript
// Send an image
{
  action: 'SEND_IMAGE_OPENCHAT',
  content: {
    chatId: 'general',
    filePath: './image.jpg',
    caption: 'Check out this image!'
  }
}

// Send a file
{
  action: 'SEND_FILE_OPENCHAT',
  content: {
    chatId: 'documents',
    filePath: './report.pdf',
    fileName: 'monthly-report.pdf',
    mimeType: 'application/pdf'
  }
}
```

### Channel Management

```typescript
// Create a channel
{
  action: 'CREATE_CHANNEL_OPENCHAT',
  content: {
    name: 'new-project',
    description: 'Discussion about the new project',
    isPublic: false,
    permissions: {
      canSendMessages: true,
      canInviteUsers: false,
      canRemoveUsers: false
    }
  }
}

// Delete a channel
{
  action: 'DELETE_CHANNEL_OPENCHAT',
  content: {
    chatId: 'old-channel-id'
  }
}
```

### Member Management

```typescript
// Invite members
{
  action: 'INVITE_MEMBERS_OPENCHAT',
  content: {
    chatId: 'project-team',
    userIds: ['user1', 'user2', 'user3']
  }
}

// Remove members
{
  action: 'REMOVE_MEMBERS_OPENCHAT',
  content: {
    chatId: 'project-team',
    userIds: ['inactive-user'],
    reason: 'Inactive member cleanup'
  }
}
```

### Getting Chat Information

```typescript
{
  action: 'GET_CHAT_DETAILS_OPENCHAT',
  content: {
    chatId: 'general'
  }
}
```

## Architecture

### Client (`OpenChatClient`)

The core client handles all communication with the OpenChat API and WebSocket connections for real-time events.

### Actions

Individual actions handle specific functionality:
- Message sending (text, media, files)
- Channel management
- Member management
- Information retrieval

### Providers

The message provider supplies context about recent messages and chat details to help agents make informed responses.

### Services

The OpenChat service manages the lifecycle of the connection, handles incoming events, and processes them through the ElizaOS runtime.

## OpenChat Bot Infrastructure

This plugin leverages OpenChat's bot infrastructure which supports:

- **Send Messages**: text, image, video, audio, file, poll, giphy, custom
- **Channel Operations**: Create and delete channels
- **Member Operations**: Invite and remove members
- **Information Access**: Read chat details, message events, and member events

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Security Considerations

- **API Keys**: Store API keys securely using environment variables
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Comprehensive error handling prevents crashes
- **Rate Limiting**: Respect OpenChat's rate limits to avoid being blocked

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/elizaos/openchat-plugin/issues)
- ElizaOS Documentation: [docs.elizaos.ai](https://docs.elizaos.ai)
- OpenChat Documentation: [OpenChat Bots](https://github.com/open-chat-labs/open-chat-bots)

## Changelog

### v1.0.0
- Initial release
- Full OpenChat integration
- Support for all message types
- Channel and member management
- Real-time event processing
- Comprehensive error handling