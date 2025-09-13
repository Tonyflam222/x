# OpenChat Plugin Configuration Guide

This guide covers all configuration options for the OpenChat plugin.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Environment Variables](#environment-variables)
- [Advanced Configuration](#advanced-configuration)
- [Network Settings](#network-settings)
- [Bot Settings](#bot-settings)
- [Rate Limiting](#rate-limiting)
- [Identity Management](#identity-management)
- [Webhook Configuration](#webhook-configuration)
- [Troubleshooting](#troubleshooting)

## Basic Configuration

### Minimal Setup

```typescript
import { createOpenChatConfig, openChatPlugin } from '@elizaos/plugin-openchat';

const config = createOpenChatConfig({
  network: 'mainnet',
  canisterIds: {
    userIndex: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    groupIndex: 'bkyz2-fmaaa-aaaah-qcaiq-cai',
    // ... other required canister IDs
  },
  botSettings: {
    username: 'my_bot',
  },
});

const character = {
  name: "MyBot",
  plugins: [openChatPlugin],
  settings: {
    OPENCHAT_CONFIG: config,
  },
};
```

### Required Fields

The following fields are mandatory:

- `network`: IC network ('local', 'testnet', 'mainnet')
- `canisterIds.userIndex`: User index canister ID
- `canisterIds.groupIndex`: Group index canister ID  
- `botSettings.username`: Bot username (3-20 characters, alphanumeric + underscore)

## Environment Variables

You can configure the plugin using environment variables instead of or in addition to the config object:

### Core Settings

```bash
# Network configuration
OPENCHAT_NETWORK=mainnet

# Required canister IDs
OPENCHAT_USER_INDEX_CANISTER=rdmx6-jaaaa-aaaah-qcaiq-cai
OPENCHAT_GROUP_INDEX_CANISTER=bkyz2-fmaaa-aaaah-qcaiq-cai
OPENCHAT_NOTIFICATIONS_CANISTER=iywa7-ayaaa-aaaah-qcaiq-cai
OPENCHAT_ONLINE_USERS_CANISTER=dxhxa-iyaaa-aaaah-qcaiq-cai
OPENCHAT_PROPOSALS_CANISTER=rqch6-3yaaa-aaaah-qcaiq-cai
OPENCHAT_REGISTRY_CANISTER=rdmx6-jaaaa-aaaah-qcaiq-cai
OPENCHAT_INTERNET_IDENTITY_CANISTER=rdmx6-jaaaa-aaaah-qcaiq-cai

# Bot configuration
OPENCHAT_BOT_USERNAME=my_eliza_bot
OPENCHAT_BOT_DISPLAY_NAME="Eliza AI Assistant"
OPENCHAT_BOT_BIO="An AI assistant powered by ElizaOS"
OPENCHAT_BOT_AVATAR_URL=https://example.com/avatar.png
```

### Behavior Settings

```bash
# Response behavior
OPENCHAT_AUTO_JOIN_GROUPS=false
OPENCHAT_RESPOND_TO_DMS=true
OPENCHAT_RESPOND_TO_MENTIONS=true
OPENCHAT_MAX_MESSAGE_LENGTH=1000

# Rate limiting
OPENCHAT_RATE_LIMIT_PER_MINUTE=10
OPENCHAT_RATE_LIMIT_PER_HOUR=100
OPENCHAT_MAX_CONCURRENT_CHATS=50
```

### Identity Configuration

```bash
# Choose ONE of these methods:

# Method 1: Private key
OPENCHAT_PRIVATE_KEY=your-private-key-here

# Method 2: Seed phrase
OPENCHAT_SEED_PHRASE="your twelve word seed phrase here"

# Method 3: PEM file path
OPENCHAT_PEM_FILE=/path/to/identity.pem
```

### Webhook Settings (Optional)

```bash
OPENCHAT_WEBHOOK_URL=https://your-server.com/webhook
OPENCHAT_WEBHOOK_SECRET=your-webhook-secret
OPENCHAT_WEBHOOK_EVENTS=message,user_joined,user_left
```

## Advanced Configuration

### Complete Configuration Object

```typescript
import { OpenChatConfig } from '@elizaos/plugin-openchat';

const config: OpenChatConfig = {
  // Network settings
  network: 'mainnet', // 'local' | 'testnet' | 'mainnet'
  
  // Canister IDs - get current ones from OpenChat docs
  canisterIds: {
    userIndex: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    groupIndex: 'bkyz2-fmaaa-aaaah-qcaiq-cai',
    notifications: 'iywa7-ayaaa-aaaah-qcaiq-cai',
    onlineUsers: 'dxhxa-iyaaa-aaaah-qcaiq-cai',
    proposals: 'rqch6-3yaaa-aaaah-qcaiq-cai',
    registry: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    internetIdentity: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
  },
  
  // Bot identity and behavior
  botSettings: {
    username: 'eliza_assistant',
    displayName: 'Eliza AI Assistant',
    bio: 'An AI assistant powered by ElizaOS. Ask me anything!',
    avatarUrl: 'https://example.com/avatar.png',
    
    // Behavior flags
    autoJoinPublicGroups: false,
    respondToDirectMessages: true,
    respondToGroupMentions: true,
    maxMessageLength: 1000,
  },
  
  // Rate limiting to prevent spam
  rateLimits: {
    messagesPerMinute: 10,
    messagesPerHour: 100,
    maxConcurrentChats: 50,
  },
  
  // Identity configuration (choose one)
  identity: {
    privateKey: process.env.OPENCHAT_PRIVATE_KEY,
    // OR
    seedPhrase: process.env.OPENCHAT_SEED_PHRASE,
    // OR
    pemFile: process.env.OPENCHAT_PEM_FILE,
  },
  
  // Webhook for real-time events (optional)
  webhook: {
    url: process.env.OPENCHAT_WEBHOOK_URL,
    secret: process.env.OPENCHAT_WEBHOOK_SECRET,
    events: ['message', 'user_joined', 'user_left'],
  },
};
```

## Network Settings

### Local Development

For local Internet Computer development:

```typescript
const config = createOpenChatConfig({
  network: 'local',
  canisterIds: {
    // Use local canister IDs from dfx.json
    userIndex: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    groupIndex: 'rno2w-sqaaa-aaaaa-aaacq-cai',
    // ... other local IDs
  },
  // ... rest of config
});
```

### Testnet

For IC testnet:

```typescript
const config = createOpenChatConfig({
  network: 'testnet',
  canisterIds: {
    // Use testnet canister IDs
    userIndex: 'testnet-user-index-id',
    groupIndex: 'testnet-group-index-id',
    // ... other testnet IDs
  },
  // ... rest of config
});
```

### Mainnet

For IC mainnet (production):

```typescript
const config = createOpenChatConfig({
  network: 'mainnet',
  canisterIds: {
    // Use current mainnet canister IDs
    // Check OpenChat documentation for latest IDs
    userIndex: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    groupIndex: 'bkyz2-fmaaa-aaaah-qcaiq-cai',
    // ... other mainnet IDs
  },
  // ... rest of config
});
```

## Bot Settings

### Username Requirements

- 3-20 characters long
- Letters, numbers, and underscores only
- Must be unique on OpenChat
- Cannot be changed after registration

```typescript
botSettings: {
  username: 'my_awesome_bot', // ✅ Valid
  // username: 'ab',          // ❌ Too short
  // username: 'my-bot',      // ❌ No hyphens
  // username: 'very_long_bot_name_here', // ❌ Too long
}
```

### Display Name and Bio

```typescript
botSettings: {
  username: 'eliza_bot',
  displayName: 'Eliza - AI Assistant', // Shown in UI
  bio: 'I am an AI assistant powered by ElizaOS. I can help with questions, provide information, and engage in conversations. Feel free to message me anytime!',
  avatarUrl: 'https://example.com/bot-avatar.png', // Optional
}
```

### Behavior Configuration

```typescript
botSettings: {
  // Auto-join public groups when mentioned or invited
  autoJoinPublicGroups: false,
  
  // Respond to direct messages automatically
  respondToDirectMessages: true,
  
  // Respond when mentioned in group chats
  respondToGroupMentions: true,
  
  // Maximum length for outgoing messages
  maxMessageLength: 1000, // Max 4000 for OpenChat
}
```

## Rate Limiting

Rate limiting prevents your bot from being flagged as spam:

```typescript
rateLimits: {
  // Messages per minute per chat
  messagesPerMinute: 10,
  
  // Messages per hour per chat  
  messagesPerHour: 100,
  
  // Maximum concurrent conversations
  maxConcurrentChats: 50,
}
```

### Rate Limit Strategies

1. **Conservative** (recommended for most bots):
```typescript
rateLimits: {
  messagesPerMinute: 5,
  messagesPerHour: 50,
  maxConcurrentChats: 20,
}
```

2. **Moderate** (for active community bots):
```typescript
rateLimits: {
  messagesPerMinute: 10,
  messagesPerHour: 100,
  maxConcurrentChats: 50,
}
```

3. **Aggressive** (use with caution):
```typescript
rateLimits: {
  messagesPerMinute: 20,
  messagesPerHour: 200,
  maxConcurrentChats: 100,
}
```

## Identity Management

### Private Key Method

```typescript
identity: {
  privateKey: '308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b0201010420...',
}
```

### Seed Phrase Method

```typescript
identity: {
  seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
}
```

### PEM File Method

```typescript
identity: {
  pemFile: '/path/to/identity.pem',
}
```

### Generating Identity

You can generate a new identity using `dfx`:

```bash
# Create new identity
dfx identity new my_bot_identity

# Get the identity file location
dfx identity get-principal --identity my_bot_identity

# Export private key (if needed)
dfx identity export my_bot_identity > bot_identity.pem
```

## Webhook Configuration

Webhooks provide real-time event notifications:

```typescript
webhook: {
  url: 'https://your-server.com/openchat-webhook',
  secret: 'your-webhook-secret-for-verification',
  events: [
    'message',
    'message_edited', 
    'message_deleted',
    'user_joined',
    'user_left',
    'chat_updated',
  ],
}
```

### Webhook Server Example

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

app.post('/openchat-webhook', (req, res) => {
  const signature = req.headers['x-openchat-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.OPENCHAT_WEBHOOK_SECRET;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook event
  const event = req.body;
  console.log('OpenChat event:', event.type, event.data);
  
  res.status(200).send('OK');
});

app.listen(3000);
```

## Troubleshooting

### Common Configuration Issues

#### 1. Invalid Canister IDs

**Error**: `Invalid canister ID format`

**Solution**: Ensure canister IDs follow the correct format:
```
rdmx6-jaaaa-aaaah-qcaiq-cai
```

#### 2. Network Mismatch

**Error**: `Canister not found on network`

**Solution**: Verify you're using the correct canister IDs for your network:
- Local: Check `dfx.json` or `.dfx/local/canister_ids.json`
- Testnet: Use testnet-specific canister IDs
- Mainnet: Use current production canister IDs

#### 3. Username Validation

**Error**: `Invalid username format`

**Solution**: Check username requirements:
- 3-20 characters
- Letters, numbers, underscores only
- No spaces or special characters

#### 4. Authentication Issues

**Error**: `Authentication failed`

**Solutions**:
- Verify identity configuration
- Check private key/seed phrase format
- Ensure PEM file exists and is readable
- For local development, make sure `dfx start` is running

#### 5. Rate Limiting

**Error**: `Rate limit exceeded`

**Solutions**:
- Reduce rate limits in configuration
- Implement exponential backoff
- Check for infinite loops in message handling

### Debug Configuration

Enable debug logging:

```typescript
const config = createOpenChatConfig({
  // ... your config
  debug: true, // Enable debug logging
});
```

### Validation

Use the built-in validation function:

```typescript
import { validateOpenChatConfig } from '@elizaos/plugin-openchat';

const errors = validateOpenChatConfig(config);
if (errors.length > 0) {
  console.error('Configuration errors:');
  errors.forEach(error => console.error(`- ${error}`));
}
```

### Health Check

Test your configuration:

```typescript
import { OpenChatClient } from '@elizaos/plugin-openchat';

async function testConfig() {
  const client = new OpenChatClient(config);
  
  try {
    const user = await client.getCurrentUser();
    console.log('✅ Configuration valid, user:', user?.username);
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
  } finally {
    await client.disconnect();
  }
}
```

## Best Practices

1. **Security**:
   - Never commit private keys to version control
   - Use environment variables for sensitive data
   - Rotate keys regularly

2. **Performance**:
   - Set appropriate rate limits
   - Monitor resource usage
   - Use caching when possible

3. **Reliability**:
   - Validate configuration on startup
   - Implement proper error handling
   - Use health checks

4. **Monitoring**:
   - Log important events
   - Track message success rates
   - Monitor rate limit usage

This configuration guide should help you set up the OpenChat plugin correctly for your specific needs and environment.