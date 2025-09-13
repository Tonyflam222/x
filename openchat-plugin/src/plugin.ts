import { Plugin } from '@elizaos/core';
import { sendMessageAction } from './actions/sendMessage.js';
import { sendImageAction, sendFileAction } from './actions/sendMedia.js';
import { sendPollAction } from './actions/sendPoll.js';
import { createChannelAction, deleteChannelAction } from './actions/channelManagement.js';
import { inviteMembersAction, removeMembersAction } from './actions/memberManagement.js';
import { getChatDetailsAction } from './actions/getChatDetails.js';
import { openChatMessageProvider } from './providers/messageProvider.js';
import { OpenChatService } from './services/openChatService.js';

export const plugin: Plugin = {
  name: 'openchat',
  description: 'OpenChat integration plugin for ElizaOS - enables AI agents to interact with OpenChat blockchain-based chat platform',
  actions: [
    sendMessageAction,
    sendImageAction,
    sendFileAction,
    sendPollAction,
    createChannelAction,
    deleteChannelAction,
    inviteMembersAction,
    removeMembersAction,
    getChatDetailsAction,
  ],
  providers: [
    openChatMessageProvider,
  ],
  services: [
    OpenChatService,
  ],
  evaluators: [],
  clients: [],
};