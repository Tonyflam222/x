# OpenChat Plugin Integration Guide

This guide provides step-by-step instructions for integrating the OpenChat plugin with your ElizaOS agent.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Basic Integration](#basic-integration)
5. [Advanced Configuration](#advanced-configuration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before integrating the OpenChat plugin, ensure you have:

- **ElizaOS**: Version 0.1.0 or higher
- **Node.js**: Version 18 or higher
- **Internet Computer Identity**: Either a private key or Internet Identity
- **OpenChat Account**: Access to OpenChat platform
- **Canister Knowledge**: Basic understanding of Internet Computer canisters

## Installation

### Method 1: NPM Installation

```bash
npm install @elizaos/plugin-openchat
```

### Method 2: Local Development

```bash
# Clone the repository
git clone https://github.com/elizaOS/eliza.git
cd eliza/packages/plugin-openchat

# Install dependencies
pnpm install

# Build the plugin
pnpm build
```

### Method 3: Direct Integration

Copy the plugin source code to your project:

```bash
cp -r packages/plugin-openchat your-project/plugins/
```

## Configuration

### Environment Setup

Create a `.env` file in your project root:

```env
# OpenChat Configuration
OPENCHAT_CANISTER_ID=6hsbt-vqaaa-aaaaf-aaafq-cai
OPENCHAT_ENVIRONMENT=ic
OPENCHAT_HOST=https://ic0.app

# Identity Configuration (choose one method)
# Method 1: Private Key (recommended for bots)
OPENCHAT_PRIVATE_KEY=your_hex_private_key_here

# Method 2: Internet Identity
OPENCHAT_IDENTITY_PROVIDER=https://identity.ic0.app
OPENCHAT_USER_PRINCIPAL=your_principal_id_here

# Chat Configuration
OPENCHAT_DEFAULT_CHAT_ID=your_default_chat_id_here

# Optional: Local Development
# OPENCHAT_ENVIRONMENT=local
# OPENCHAT_HOST=http://localhost:8080
```

### Identity Generation

#### Option 1: Generate New Identity

```typescript
import { Ed25519KeyIdentity } from '@dfinity/identity';

// Generate a new identity
const identity = Ed25519KeyIdentity.generate();
const privateKey = Buffer.from(identity.getKeyPair().secretKey).toString('hex');
console.log('Private Key:', privateKey);
console.log('Principal:', identity.getPrincipal().toString());
```

#### Option 2: Use Existing Identity

If you have an existing Internet Computer identity, export the private key:

```bash
# Using dfx (if you have it installed)
dfx identity export your_identity_name
```

### Character Configuration

Update your character configuration file:

```json
{
  "name": "OpenChatBot",
  "username": "openchatbot",
  "plugins": ["@elizaos/plugin-openchat"],
  "settings": {
    "OPENCHAT_CANISTER_ID": "6hsbt-vqaaa-aaaaf-aaafq-cai",
    "OPENCHAT_DEFAULT_CHAT_ID": "your_chat_id_here",
    "OPENCHAT_ENVIRONMENT": "ic"
  },
  "bio": [
    "I am an AI assistant integrated with OpenChat.",
    "I can send messages, join groups, and help manage your OpenChat experience."
  ],
  "messageExamples": [
    [
      {
        "user": "{{user1}}",
        "content": { "text": "Send hello to the main chat" }
      },
      {
        "user": "OpenChatBot",
        "content": { 
          "text": "I'll send that message to OpenChat!",
          "action": "SEND_OPENCHAT_MESSAGE"
        }
      }
    ]
  ]
}
```

## Basic Integration

### Step 1: Import the Plugin

```typescript
import { openChatPlugin } from '@elizaos/plugin-openchat';
import { Agent } from '@elizaos/core';

const agent = new Agent({
  character: {
    name: 'OpenChatBot',
    plugins: [openChatPlugin]
  }
});
```

### Step 2: Initialize the Agent

```typescript
async function initializeAgent() {
  try {
    await agent.initialize();
    console.log('Agent initialized successfully');
  } catch (error) {
    console.error('Failed to initialize agent:', error);
  }
}
```

### Step 3: Test Basic Functionality

```typescript
import { getOpenChatService } from '@elizaos/plugin-openchat';

async function testBasicFunctionality() {
  const service = getOpenChatService(agent.runtime);
  
  if (!service) {
    console.error('OpenChat service not available');
    return;
  }

  // Test connection
  const isHealthy = await service.isHealthy();
  console.log('Service health:', isHealthy);

  // Send a test message
  const chatId = 'your_chat_id_here';
  const success = await service.sendMessage(chatId, 'Hello from ElizaOS!');
  console.log('Message sent:', success);
}
```

## Advanced Configuration

### Custom Service Configuration

```typescript
import { OpenChatService, OpenChatConfig } from '@elizaos/plugin-openchat';

const customConfig: OpenChatConfig = {
  canisterId: 'your_canister_id',
  environment: 'ic',
  privateKey: process.env.OPENCHAT_PRIVATE_KEY,
  // Add custom configuration options
};

const customService = new OpenChatService(runtime, customConfig);
```

### Multi-Chat Setup

```typescript
// Configure multiple chat channels
const chatChannels = {
  main: 'main_chat_id',
  development: 'dev_chat_id',
  support: 'support_chat_id',
  announcements: 'announcements_chat_id'
};

// Store in runtime settings
Object.entries(chatChannels).forEach(([key, chatId]) => {
  runtime.setSetting(`OPENCHAT_${key.toUpperCase()}_CHAT`, chatId);
});
```

### Custom Event Handlers

```typescript
import { OpenChatEvent } from '@elizaos/plugin-openchat';

class CustomOpenChatHandler {
  async handleMessage(event: OpenChatEvent) {
    if (event.type === 'message') {
      console.log(`New message from ${event.userId}: ${event.content?.text}`);
      
      // Custom logic here
      if (event.content?.text?.includes('@bot')) {
        await this.respondToMention(event);
      }
    }
  }

  private async respondToMention(event: OpenChatEvent) {
    const service = getOpenChatService(runtime);
    await service.sendMessage(
      event.chatId.toString(),
      `Hello! You mentioned me. How can I help?`
    );
  }
}
```

### Message Processing Pipeline

```typescript
class MessageProcessor {
  private filters: Array<(message: string) => boolean> = [];
  private processors: Array<(message: string) => Promise<string>> = [];

  addFilter(filter: (message: string) => boolean) {
    this.filters.push(filter);
  }

  addProcessor(processor: (message: string) => Promise<string>) {
    this.processors.push(processor);
  }

  async processMessage(message: string): Promise<string | null> {
    // Apply filters
    if (!this.filters.every(filter => filter(message))) {
      return null;
    }

    // Apply processors
    let processedMessage = message;
    for (const processor of this.processors) {
      processedMessage = await processor(processedMessage);
    }

    return processedMessage;
  }
}

// Usage
const processor = new MessageProcessor();
processor.addFilter(msg => msg.length > 0);
processor.addFilter(msg => !msg.startsWith('/'));
processor.addProcessor(async msg => msg.toLowerCase());
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenChatClient } from '@elizaos/plugin-openchat';

describe('OpenChat Plugin', () => {
  let client: OpenChatClient;

  beforeEach(() => {
    client = new OpenChatClient({
      canisterId: 'test-canister-id',
      environment: 'local'
    });
  });

  it('should generate valid message ID', () => {
    const messageId = client.generateMessageId();
    expect(typeof messageId).toBe('bigint');
    expect(messageId > 0n).toBe(true);
  });

  it('should generate valid correlation ID', () => {
    const correlationId = client.generateCorrelationId();
    expect(typeof correlationId).toBe('bigint');
    expect(correlationId > 0n).toBe(true);
  });
});
```

### Integration Tests

```typescript
async function runIntegrationTests() {
  const testConfig = {
    canisterId: process.env.TEST_OPENCHAT_CANISTER_ID,
    environment: 'local' as const,
    privateKey: process.env.TEST_PRIVATE_KEY
  };

  const client = new OpenChatClient(testConfig);

  try {
    // Test user info
    const user = await client.getCurrentUser();
    console.log('✅ User info retrieved:', user.username);

    // Test group listing
    const groups = await client.getPublicGroups();
    console.log('✅ Groups retrieved:', groups.length);

    // Test message sending (if test chat available)
    if (process.env.TEST_CHAT_ID) {
      const response = await client.sendMessage({
        chatId: Principal.fromText(process.env.TEST_CHAT_ID),
        messageId: client.generateMessageId(),
        content: { text: 'Test message from integration test' },
        correlationId: client.generateCorrelationId()
      });
      console.log('✅ Message sent:', response.messageIndex);
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}
```

### Manual Testing

```bash
# Start your agent in development mode
npm run dev

# In another terminal, test the plugin
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Send hello to the main OpenChat group",
    "userId": "test-user"
  }'
```

## Deployment

### Production Environment

```typescript
// production.config.ts
export const productionConfig = {
  openchat: {
    canisterId: process.env.OPENCHAT_CANISTER_ID,
    environment: 'ic',
    privateKey: process.env.OPENCHAT_PRIVATE_KEY,
    defaultChatId: process.env.OPENCHAT_DEFAULT_CHAT_ID
  },
  monitoring: {
    enabled: true,
    healthCheckInterval: 60000, // 1 minute
    errorReporting: true
  }
};
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/plugin-openchat/package.json ./packages/plugin-openchat/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV OPENCHAT_ENVIRONMENT=ic

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables for Production

```env
# Production OpenChat Configuration
OPENCHAT_CANISTER_ID=6hsbt-vqaaa-aaaaf-aaafq-cai
OPENCHAT_ENVIRONMENT=ic
OPENCHAT_HOST=https://ic0.app
OPENCHAT_PRIVATE_KEY=your_production_private_key
OPENCHAT_DEFAULT_CHAT_ID=your_production_chat_id

# Monitoring and Logging
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# Security
RATE_LIMIT_ENABLED=true
MAX_MESSAGES_PER_MINUTE=10
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Errors

**Problem**: "Not authorized" or "Identity not found"

**Solutions**:
- Verify your private key is correct and in hex format
- Ensure your identity has the necessary permissions
- Check if your principal is registered with OpenChat

```typescript
// Debug identity
import { Ed25519KeyIdentity } from '@dfinity/identity';

const identity = Ed25519KeyIdentity.fromSecretKey(
  Buffer.from(process.env.OPENCHAT_PRIVATE_KEY, 'hex')
);
console.log('Principal:', identity.getPrincipal().toString());
```

#### 2. Connection Issues

**Problem**: "Failed to connect to canister"

**Solutions**:
- Verify the canister ID is correct
- Check network connectivity
- Ensure you're using the correct environment (local/ic)

```typescript
// Test connection
const agent = new HttpAgent({ host: 'https://ic0.app' });
await agent.fetchRootKey(); // Only for local development
```

#### 3. Message Send Failures

**Problem**: Messages fail to send

**Solutions**:
- Verify you're a member of the target group
- Check message content format
- Ensure proper permissions

```typescript
// Debug message sending
try {
  const response = await client.sendMessage(args);
  console.log('Success:', response);
} catch (error) {
  console.error('Error details:', error);
  // Check specific error types
  if (error.message.includes('not_authorized')) {
    console.log('Permission issue - check group membership');
  }
}
```

#### 4. WebSocket Connection Issues

**Problem**: Real-time events not working

**Solutions**:
- Check WebSocket URL configuration
- Verify firewall settings
- Test WebSocket connection manually

```typescript
// Test WebSocket connection
import WebSocket from 'ws';

const ws = new WebSocket('wss://openchat.app/ws');
ws.on('open', () => console.log('WebSocket connected'));
ws.on('error', (error) => console.error('WebSocket error:', error));
```

### Debug Mode

Enable comprehensive logging:

```typescript
import { elizaLogger } from '@elizaos/core';

// Set debug level
elizaLogger.setLevel('debug');

// Custom debug function
function debugOpenChat(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OpenChat Debug] ${message}`, data || '');
  }
}
```

### Health Monitoring

```typescript
class OpenChatHealthMonitor {
  private service: OpenChatService;
  private checkInterval: NodeJS.Timeout;

  constructor(service: OpenChatService) {
    this.service = service;
    this.startMonitoring();
  }

  private startMonitoring() {
    this.checkInterval = setInterval(async () => {
      const isHealthy = await this.service.isHealthy();
      if (!isHealthy) {
        console.error('OpenChat service unhealthy - attempting restart');
        await this.attemptRestart();
      }
    }, 60000); // Check every minute
  }

  private async attemptRestart() {
    try {
      await this.service.stop();
      await this.service.initialize();
      console.log('OpenChat service restarted successfully');
    } catch (error) {
      console.error('Failed to restart OpenChat service:', error);
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
```

## Support and Resources

- **OpenChat Documentation**: https://docs.openchat.app
- **Internet Computer Docs**: https://internetcomputer.org/docs
- **ElizaOS Documentation**: https://docs.elizaos.ai
- **GitHub Issues**: https://github.com/elizaOS/eliza/issues
- **Community Discord**: [ElizaOS Discord Server]
- **OpenChat Community**: [OpenChat Groups]

For additional help, please create an issue in the GitHub repository with:
- Your configuration (without sensitive data)
- Error messages and logs
- Steps to reproduce the problem
- Expected vs actual behavior