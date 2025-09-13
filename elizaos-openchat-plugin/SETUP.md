# OpenChat Plugin Setup Guide

This guide will walk you through setting up the OpenChat plugin for ElizaOS, from installation to deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [OpenChat Setup](#openchat-setup)
5. [ElizaOS Integration](#elizaos-integration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js v18 or higher
- npm or yarn package manager
- Internet Computer identity (for OpenChat access)
- ElizaOS framework installed

### Knowledge Requirements
- Basic understanding of TypeScript/JavaScript
- Familiarity with Internet Computer concepts
- Basic knowledge of ElizaOS plugin system

## Installation

### 1. Install the Plugin

```bash
# Using npm
npm install @elizaos/plugin-openchat

# Using yarn
yarn add @elizaos/plugin-openchat

# Using pnpm
pnpm add @elizaos/plugin-openchat
```

### 2. Install Peer Dependencies

```bash
# ElizaOS core (if not already installed)
npm install @elizaos/core

# Internet Computer dependencies
npm install @dfinity/agent @dfinity/candid @dfinity/principal
```

## Configuration

### 1. Environment Variables

Create a `.env` file in your project root:

```bash
# Required - OpenChat canister ID
OPENCHAT_CANISTER_ID=your_openchat_canister_id

# Optional - Internet Computer host (defaults to https://ic0.app)
OPENCHAT_HOST=https://ic0.app

# Optional - Whether to fetch root key (for local development)
OPENCHAT_FETCH_ROOT_KEY=false

# Optional - Message polling interval in milliseconds
OPENCHAT_POLL_INTERVAL=5000

# Optional - Comma-separated list of chat IDs to monitor
OPENCHAT_MONITORED_CHATS=general,tech-support,community

# Optional - Agent's user ID in OpenChat
OPENCHAT_AGENT_USER_ID=your_agent_user_id
```

### 2. Character Configuration

Update your character configuration to include the OpenChat plugin:

```typescript
// character.ts
import { Character } from '@elizaos/core';
import { openChatPlugin } from '@elizaos/plugin-openchat';

export const character: Character = {
    name: "OpenChatBot",
    bio: "An AI agent that interacts with OpenChat",
    plugins: [
        openChatPlugin,
        // ... other plugins
    ],
    settings: {
        secrets: {
            OPENCHAT_CANISTER_ID: process.env.OPENCHAT_CANISTER_ID,
            OPENCHAT_HOST: process.env.OPENCHAT_HOST,
            // ... other settings
        }
    },
    // ... rest of character config
};
```

## OpenChat Setup

### 1. Create OpenChat Account

1. Visit [OpenChat](https://oc.app)
2. Create an account using Internet Identity
3. Note your Principal ID for later use

### 2. Find Canister ID

The OpenChat canister ID can be found in several ways:

**Method 1: From OpenChat Interface**
- Open browser developer tools on OpenChat
- Look for canister calls in the Network tab
- Find the canister ID in the request URLs

**Method 2: From OpenChat Documentation**
- Check the official OpenChat documentation
- Look for the main canister ID

**Method 3: Using dfx (if you have IC SDK)**
```bash
dfx canister --network ic id openchat
```

### 3. Join Groups/Channels

1. Join the groups/channels you want your agent to monitor
2. Note the group/channel IDs
3. Add these IDs to your `OPENCHAT_MONITORED_CHATS` environment variable

### 4. Set Up Bot Identity (Advanced)

For production use, create a dedicated identity for your bot:

```bash
# Create new identity
dfx identity new openchat-bot

# Use the new identity
dfx identity use openchat-bot

# Get the principal
dfx identity get-principal
```

## ElizaOS Integration

### 1. Basic Integration

```typescript
// index.ts
import { createAgent } from '@elizaos/core';
import { openChatPlugin } from '@elizaos/plugin-openchat';
import { character } from './character.js';

async function main() {
    const agent = await createAgent(character, {
        plugins: [openChatPlugin]
    });
    
    await agent.start();
    console.log('OpenChat agent started successfully!');
}

main().catch(console.error);
```

### 2. Advanced Integration with Custom Handlers

```typescript
// advanced-setup.ts
import { createAgent, IAgentRuntime } from '@elizaos/core';
import { OpenChatClient, openChatPlugin } from '@elizaos/plugin-openchat';
import { character } from './character.js';

async function setupAdvancedAgent() {
    const agent = await createAgent(character, {
        plugins: [openChatPlugin]
    });
    
    // Get the OpenChat client
    const openChatClient = agent.clients.find(
        client => client instanceof OpenChatClient
    ) as OpenChatClient;
    
    if (openChatClient) {
        // Set up custom event handlers
        openChatClient.on('message', async (event) => {
            console.log('Received message:', event.data.content);
            
            // Custom logic here
            if (event.data.content.includes('@bot')) {
                await openChatClient.sendMessage(
                    event.data.chatId,
                    "Hello! You mentioned me. How can I help?",
                    event.data.id
                );
            }
        });
        
        openChatClient.on('connected', () => {
            console.log('OpenChat client connected!');
        });
        
        openChatClient.on('error', (error) => {
            console.error('OpenChat error:', error);
        });
    }
    
    await agent.start();
    return agent;
}
```

## Testing

### 1. Local Testing

Create a test script to verify your setup:

```typescript
// test-setup.ts
import { OpenChatService } from '@elizaos/plugin-openchat';

async function testOpenChatConnection() {
    const service = new OpenChatService({
        canisterId: process.env.OPENCHAT_CANISTER_ID!,
        host: process.env.OPENCHAT_HOST || 'https://ic0.app',
        fetchRootKey: process.env.OPENCHAT_FETCH_ROOT_KEY === 'true',
    });
    
    try {
        // Test basic functionality
        console.log('Testing OpenChat connection...');
        
        // Try to get messages from a test chat
        const messages = await service.getMessages('test-chat', 0, 5);
        console.log('Connection successful!', messages.length, 'messages found');
        
        return true;
    } catch (error) {
        console.error('Connection failed:', error);
        return false;
    }
}

testOpenChatConnection();
```

### 2. Integration Testing

Test the full plugin integration:

```bash
# Run your agent in test mode
npm run start:test

# Or with debug logging
DEBUG=elizaos:openchat npm run start
```

### 3. Manual Testing Checklist

- [ ] Agent starts without errors
- [ ] Connects to OpenChat successfully
- [ ] Receives messages from monitored chats
- [ ] Can send messages in response
- [ ] Can join/leave groups
- [ ] Can add reactions to messages
- [ ] Handles errors gracefully

## Deployment

### 1. Production Environment Setup

```bash
# Set production environment variables
export NODE_ENV=production
export OPENCHAT_CANISTER_ID=your_production_canister_id
export OPENCHAT_HOST=https://ic0.app
export OPENCHAT_FETCH_ROOT_KEY=false
# ... other production settings
```

### 2. Docker Deployment

Create a Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t openchat-agent .
docker run -d --env-file .env -p 3000:3000 openchat-agent
```

### 3. Cloud Deployment

**Vercel:**
```bash
npm i -g vercel
vercel --env OPENCHAT_CANISTER_ID=your_canister_id
```

**Railway:**
```bash
npm i -g @railway/cli
railway login
railway deploy
```

**Heroku:**
```bash
heroku create your-openchat-agent
heroku config:set OPENCHAT_CANISTER_ID=your_canister_id
git push heroku main
```

## Troubleshooting

### Common Issues

#### 1. "OpenChat canister ID not configured"
```bash
# Solution: Set the environment variable
export OPENCHAT_CANISTER_ID=your_canister_id
```

#### 2. "Connection test failed"
```bash
# Check your canister ID and network settings
# Verify you can access OpenChat in your browser
# Check Internet Computer network status
```

#### 3. "Authentication failed"
```bash
# Ensure your identity has proper permissions
# Check if the identity is the same one used to join groups
# Verify the principal ID matches your OpenChat account
```

#### 4. "No messages received"
```bash
# Check OPENCHAT_MONITORED_CHATS setting
# Verify the chat IDs are correct
# Ensure the agent has joined the groups/channels
# Check polling interval settings
```

#### 5. "Failed to send message"
```bash
# Verify send permissions in the chat
# Check message content for violations
# Ensure the chat ID is correct
# Check rate limiting
```

### Debug Mode

Enable detailed logging:

```bash
# Enable all debug logs
DEBUG=* npm start

# Enable only OpenChat logs
DEBUG=elizaos:openchat npm start

# Enable with specific log levels
LOG_LEVEL=debug npm start
```

### Health Checks

Implement health checks for monitoring:

```typescript
// health-check.ts
export async function healthCheck() {
    try {
        // Check OpenChat connection
        const service = new OpenChatService(config);
        await service.getMessages('test', 0, 1);
        
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
                openchat: 'connected',
                memory: process.memoryUsage(),
                uptime: process.uptime(),
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}
```

### Getting Help

If you encounter issues:

1. Check this troubleshooting section
2. Review the [README.md](./README.md) for additional information
3. Search existing [GitHub issues](https://github.com/elizaos-plugins/plugin-openchat/issues)
4. Create a new issue with:
   - Your configuration (remove sensitive data)
   - Error messages and logs
   - Steps to reproduce
   - Expected vs actual behavior

## Next Steps

After successful setup:

1. Customize your character's personality and responses
2. Add custom actions and evaluators
3. Implement advanced features like file handling
4. Set up monitoring and analytics
5. Deploy to production environment

Congratulations! Your OpenChat plugin should now be running successfully. 🎉