import { HttpAgent, Actor, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { 
    OpenChatConfig, 
    OpenChatMessage, 
    OpenChatUser, 
    OpenChatChannel, 
    OpenChatGroup,
    SendMessageRequest,
    SendMessageResponse,
    MessageType,
    OpenChatClient
} from '../types/index.js';

export class OpenChatService implements OpenChatClient {
    private agent: HttpAgent;
    private actor: any;
    private canisterId: string;

    constructor(config: OpenChatConfig) {
        this.canisterId = config.canisterId;
        
        this.agent = new HttpAgent({
            host: config.host || 'https://ic0.app',
        });
        
        if (config.fetchRootKey) {
            this.agent.fetchRootKey();
        }

        // Initialize the actor with OpenChat's Candid interface
        this.initializeActor();
    }

    private async initializeActor() {
        // This would normally use the actual OpenChat Candid interface
        // For now, we'll create a mock interface
        const idlFactory = ({ IDL }: any) => {
            const Message = IDL.Record({
                'id': IDL.Text,
                'content': IDL.Text,
                'sender': IDL.Principal,
                'timestamp': IDL.Nat64,
                'message_type': IDL.Text,
            });

            const SendMessageArgs = IDL.Record({
                'chat_id': IDL.Text,
                'content': IDL.Text,
                'message_type': IDL.Opt(IDL.Text),
                'replies_to': IDL.Opt(IDL.Nat32),
            });

            const SendMessageResult = IDL.Variant({
                'Ok': IDL.Record({ 'message_id': IDL.Text }),
                'Err': IDL.Text,
            });

            return IDL.Service({
                'send_message': IDL.Func([SendMessageArgs], [SendMessageResult], []),
                'get_messages': IDL.Func([IDL.Text, IDL.Opt(IDL.Nat32), IDL.Opt(IDL.Nat32)], [IDL.Vec(Message)], ['query']),
                'get_user': IDL.Func([IDL.Principal], [IDL.Opt(IDL.Record({
                    'user_id': IDL.Principal,
                    'username': IDL.Text,
                    'display_name': IDL.Opt(IDL.Text),
                }))], ['query']),
                'join_group': IDL.Func([IDL.Text], [IDL.Bool], []),
                'leave_group': IDL.Func([IDL.Text], [IDL.Bool], []),
                'add_reaction': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
                'remove_reaction': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
                'delete_message': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
                'edit_message': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
                'mark_as_read': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
            });
        };

        this.actor = Actor.createActor(idlFactory, {
            agent: this.agent,
            canisterId: this.canisterId,
        });
    }

    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        try {
            const args = {
                chat_id: request.chatId,
                content: request.content,
                message_type: request.messageType ? [request.messageType] : [],
                replies_to: request.repliesTo ? [request.repliesTo.messageIndex] : [],
            };

            const result = await this.actor.send_message(args);
            
            if ('Ok' in result) {
                return {
                    success: true,
                    messageId: result.Ok.message_id,
                };
            } else {
                return {
                    success: false,
                    error: result.Err,
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async getMessages(chatId: string, fromIndex?: number, limit?: number): Promise<OpenChatMessage[]> {
        try {
            const messages = await this.actor.get_messages(
                chatId,
                fromIndex ? [fromIndex] : [],
                limit ? [limit] : []
            );

            return messages.map((msg: any) => ({
                id: msg.id,
                sender: msg.sender.toString(),
                content: msg.content,
                timestamp: Number(msg.timestamp),
                messageType: msg.message_type as MessageType,
                chatId: chatId,
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }

    async getUser(userId: string): Promise<OpenChatUser | null> {
        try {
            const principal = Principal.fromText(userId);
            const result = await this.actor.get_user(principal);
            
            if (result && result.length > 0) {
                const user = result[0];
                return {
                    userId: user.user_id.toString(),
                    username: user.username,
                    displayName: user.display_name?.[0],
                    isPremium: false, // Would need to be determined from actual API
                    suspended: false, // Would need to be determined from actual API
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    async getChannel(channelId: string): Promise<OpenChatChannel | null> {
        // This would need to be implemented based on OpenChat's actual API
        // For now, returning null as a placeholder
        return null;
    }

    async getGroup(groupId: string): Promise<OpenChatGroup | null> {
        // This would need to be implemented based on OpenChat's actual API
        // For now, returning null as a placeholder
        return null;
    }

    async joinGroup(groupId: string): Promise<boolean> {
        try {
            const result = await this.actor.join_group(groupId);
            return result;
        } catch (error) {
            console.error('Error joining group:', error);
            return false;
        }
    }

    async leaveGroup(groupId: string): Promise<boolean> {
        try {
            const result = await this.actor.leave_group(groupId);
            return result;
        } catch (error) {
            console.error('Error leaving group:', error);
            return false;
        }
    }

    async addReaction(chatId: string, messageId: string, reaction: string): Promise<boolean> {
        try {
            const result = await this.actor.add_reaction(chatId, messageId, reaction);
            return result;
        } catch (error) {
            console.error('Error adding reaction:', error);
            return false;
        }
    }

    async removeReaction(chatId: string, messageId: string, reaction: string): Promise<boolean> {
        try {
            const result = await this.actor.remove_reaction(chatId, messageId, reaction);
            return result;
        } catch (error) {
            console.error('Error removing reaction:', error);
            return false;
        }
    }

    async deleteMessage(chatId: string, messageId: string): Promise<boolean> {
        try {
            const result = await this.actor.delete_message(chatId, messageId);
            return result;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }

    async editMessage(chatId: string, messageId: string, newContent: string): Promise<boolean> {
        try {
            const result = await this.actor.edit_message(chatId, messageId, newContent);
            return result;
        } catch (error) {
            console.error('Error editing message:', error);
            return false;
        }
    }

    async markAsRead(chatId: string, messageId: string): Promise<boolean> {
        try {
            const result = await this.actor.mark_as_read(chatId, messageId);
            return result;
        } catch (error) {
            console.error('Error marking message as read:', error);
            return false;
        }
    }

    async startTyping(chatId: string): Promise<void> {
        // This would need to be implemented based on OpenChat's actual API
        // For now, this is a placeholder
        console.log(`Started typing in chat ${chatId}`);
    }

    async stopTyping(chatId: string): Promise<void> {
        // This would need to be implemented based on OpenChat's actual API
        // For now, this is a placeholder
        console.log(`Stopped typing in chat ${chatId}`);
    }
}