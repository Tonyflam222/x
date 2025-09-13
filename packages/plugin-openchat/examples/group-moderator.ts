import { Agent, IAgentRuntime, Memory } from '@elizaos/core';
import { openChatPlugin, getOpenChatService, OpenChatEvent } from '../src/index.js';

// Advanced group moderator bot example
const moderatorCharacter = {
  name: 'OpenChatModerator',
  username: 'ocmoderator',
  plugins: [openChatPlugin],
  settings: {
    OPENCHAT_CANISTER_ID: '6hsbt-vqaaa-aaaaf-aaafq-cai',
    OPENCHAT_DEFAULT_CHAT_ID: 'moderated_group_id_here',
    MODERATION_ENABLED: true,
    WELCOME_MESSAGES: true,
    AUTO_RESPONSES: true
  },
  bio: [
    'I am an OpenChat group moderator bot.',
    'I help maintain healthy discussions and welcome new members.',
    'I can moderate content, provide information, and assist with group management.',
    'I monitor for spam, inappropriate content, and help enforce group rules.'
  ],
  lore: [
    'Dedicated to maintaining positive community spaces',
    'Experienced in OpenChat group management',
    'Committed to fair and transparent moderation'
  ],
  knowledge: [
    'OpenChat community guidelines and best practices',
    'Group moderation techniques and tools',
    'How to handle conflicts and disputes',
    'Welcome procedures for new members',
    'Spam detection and prevention methods'
  ],
  messageExamples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Welcome to the group!' }
      },
      {
        user: 'OpenChatModerator',
        content: { 
          text: 'Thank you for the warm welcome! I\'m here to help moderate and assist the community. Please feel free to ask if you have any questions about our group guidelines.'
        }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'What are the group rules?' }
      },
      {
        user: 'OpenChatModerator',
        content: { 
          text: 'Here are our main group rules:\n1. Be respectful to all members\n2. No spam or excessive self-promotion\n3. Stay on topic\n4. No harassment or hate speech\n5. Follow OpenChat community guidelines\n\nLet me know if you need clarification on any of these!'
        }
      }
    ]
  ],
  postExamples: [
    'Daily reminder: Please keep discussions respectful and on-topic. Thank you for making this a great community! 🌟',
    'New members joined today! Welcome everyone. Feel free to introduce yourselves.',
    'Great discussions happening today. Remember to follow our community guidelines.'
  ],
  adjectives: [
    'fair',
    'vigilant',
    'helpful',
    'diplomatic',
    'community-focused',
    'professional'
  ],
  topics: [
    'community moderation',
    'group guidelines',
    'conflict resolution',
    'member onboarding',
    'content policy',
    'community building'
  ],
  style: {
    all: [
      'Be professional but approachable',
      'Enforce rules fairly and consistently',
      'Explain decisions when taking moderation actions',
      'Focus on community building and positive interactions'
    ],
    chat: [
      'Respond promptly to moderation needs',
      'Use clear, diplomatic language',
      'Provide helpful guidance to members'
    ],
    post: [
      'Share community updates and reminders',
      'Highlight positive community interactions',
      'Provide educational content about group norms'
    ]
  }
};

class OpenChatModeratorService {
  private runtime: IAgentRuntime;
  private openChatService: any;
  private moderationRules: string[];
  private welcomeMessage: string;
  private warningThreshold: number = 3;
  private userWarnings: Map<string, number> = new Map();

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
    this.openChatService = getOpenChatService(runtime);
    
    this.moderationRules = [
      'no spam',
      'no hate speech',
      'no harassment',
      'stay on topic',
      'be respectful'
    ];
    
    this.welcomeMessage = `
Welcome to our OpenChat group! 🎉

Please take a moment to read our community guidelines:
• Be respectful to all members
• Keep discussions on-topic
• No spam or excessive self-promotion
• Follow OpenChat community standards

If you have any questions, feel free to ask the moderators. Enjoy your stay!
    `.trim();
  }

  async handleNewMember(userId: string, chatId: string): Promise<void> {
    if (this.runtime.getSetting('WELCOME_MESSAGES')) {
      try {
        await this.openChatService.sendMessage(chatId, this.welcomeMessage);
        console.log(`Sent welcome message for new member: ${userId}`);
      } catch (error) {
        console.error('Error sending welcome message:', error);
      }
    }
  }

  async handleMessage(message: Memory): Promise<void> {
    if (!this.runtime.getSetting('MODERATION_ENABLED')) {
      return;
    }

    const content = message.content.text?.toLowerCase() || '';
    const userId = message.userId;
    
    // Check for spam (multiple identical messages)
    if (this.isSpam(content, userId)) {
      await this.warnUser(userId, 'spam detected', message.roomId);
      return;
    }

    // Check for inappropriate content
    if (this.containsInappropriateContent(content)) {
      await this.warnUser(userId, 'inappropriate content', message.roomId);
      return;
    }

    // Check for excessive caps
    if (this.isExcessiveCaps(content)) {
      await this.sendFriendlyReminder(userId, 'Please avoid using excessive capital letters', message.roomId);
      return;
    }
  }

  private isSpam(content: string, userId: string): boolean {
    // Simple spam detection logic
    const repeatedPhrases = ['buy now', 'click here', 'free money', 'guaranteed profit'];
    return repeatedPhrases.some(phrase => content.includes(phrase));
  }

  private containsInappropriateContent(content: string): boolean {
    // Simple inappropriate content detection
    const inappropriateWords = ['hate', 'harassment', 'offensive']; // Add more as needed
    return inappropriateWords.some(word => content.includes(word));
  }

  private isExcessiveCaps(content: string): boolean {
    if (content.length < 10) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    return (capsCount / content.length) > 0.7; // More than 70% caps
  }

  private async warnUser(userId: string, reason: string, chatId: string): Promise<void> {
    const warnings = (this.userWarnings.get(userId) || 0) + 1;
    this.userWarnings.set(userId, warnings);

    let message: string;
    if (warnings >= this.warningThreshold) {
      message = `@${userId} You have received ${warnings} warnings. Please review our community guidelines. Continued violations may result in removal from the group.`;
    } else {
      message = `@${userId} Warning ${warnings}/${this.warningThreshold}: ${reason}. Please follow our community guidelines.`;
    }

    try {
      await this.openChatService.sendMessage(chatId, message);
      console.log(`Warned user ${userId} for ${reason} (Warning ${warnings})`);
    } catch (error) {
      console.error('Error sending warning:', error);
    }
  }

  private async sendFriendlyReminder(userId: string, reminder: string, chatId: string): Promise<void> {
    const message = `@${userId} Friendly reminder: ${reminder}. Thanks for helping keep our community welcoming! 😊`;
    
    try {
      await this.openChatService.sendMessage(chatId, message);
      console.log(`Sent friendly reminder to ${userId}: ${reminder}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  async generateDailyReport(chatId: string): Promise<void> {
    const now = new Date();
    const report = `
📊 Daily Moderation Report - ${now.toDateString()}

• Total warnings issued: ${Array.from(this.userWarnings.values()).reduce((a, b) => a + b, 0)}
• Users with warnings: ${this.userWarnings.size}
• Community status: ${this.userWarnings.size === 0 ? '🟢 Excellent' : this.userWarnings.size < 5 ? '🟡 Good' : '🔴 Needs attention'}

Thank you all for maintaining a positive community environment! 🌟
    `.trim();

    try {
      await this.openChatService.sendMessage(chatId, report);
      console.log('Daily moderation report sent');
    } catch (error) {
      console.error('Error sending daily report:', error);
    }
  }

  getUserWarnings(): Map<string, number> {
    return new Map(this.userWarnings);
  }

  clearUserWarnings(userId: string): void {
    this.userWarnings.delete(userId);
  }

  async handleGroupEvent(event: OpenChatEvent): Promise<void> {
    switch (event.type) {
      case 'member_joined':
        if (event.userId) {
          await this.handleNewMember(event.userId.toString(), event.chatId.toString());
        }
        break;
        
      case 'message':
        // This would be handled by the main message processing flow
        break;
        
      case 'member_left':
        // Clean up user warnings when they leave
        if (event.userId) {
          this.clearUserWarnings(event.userId.toString());
        }
        break;
    }
  }
}

async function createModeratorBot() {
  const runtime: IAgentRuntime = new Agent({
    character: moderatorCharacter,
  });

  await runtime.initialize();

  // Initialize custom moderation service
  const moderatorService = new OpenChatModeratorService(runtime);

  // Set up daily report scheduling (every 24 hours)
  const chatId = runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID');
  if (chatId) {
    setInterval(async () => {
      await moderatorService.generateDailyReport(chatId);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  return { runtime, moderatorService };
}

// Example usage
async function main() {
  try {
    const { runtime, moderatorService } = await createModeratorBot();
    console.log('OpenChat moderator bot created successfully!');
    
    // Example: Send initial moderator introduction
    const service = getOpenChatService(runtime);
    const chatId = runtime.getSetting('OPENCHAT_DEFAULT_CHAT_ID');
    
    if (service && chatId) {
      await service.sendMessage(
        chatId, 
        'Hello! I\'m your OpenChat moderator bot. I\'m here to help maintain a positive community environment. Feel free to ask me about our group guidelines! 🤖'
      );
    }
    
  } catch (error) {
    console.error('Error creating moderator bot:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createModeratorBot, OpenChatModeratorService };