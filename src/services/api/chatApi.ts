import {tokenService} from '@/services/tokenService';
import {API_BASE_URL} from '@/config/env';
import {Conversation, CreateConversationDto, GetConversationsDto, GetMessagesDto, Message} from '@/types/chat';

class ChatApiService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = await tokenService.getToken();

        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    }

    async getConversations(dto: GetConversationsDto): Promise<{
        conversations: Conversation[];
        total: number;
        limit: number;
        offset: number
    }> {
        const params = new URLSearchParams({
            limit: dto.limit.toString(),
            offset: dto.offset.toString(),
        });

        const response = await this.request<{
            conversations: any[];
            total: number;
            limit: number;
            offset: number;
        }>(`/chat/conversations?${params}`);

        const conversations: Conversation[] = response.conversations.map(conv => ({
            ...conv,
            listingId: conv.listingId || conv.listing_id || null
        }));

        return {
            ...response,
            conversations
        };
    }

    async getConversationById(conversationId: number): Promise<Conversation> {
        const conversation = await this.request<any>(`/chat/conversations/${conversationId}`);

        return {
            ...conversation,
            listingId: conversation.listingId || conversation.listing_id || null
        };
    }

    async createConversation(dto: CreateConversationDto): Promise<Conversation> {
        const conversation = await this.request<any>('/chat/conversations', {
            method: 'POST',
            body: JSON.stringify(dto),
        });

        return {
            ...conversation,
            listingId: conversation.listingId || conversation.listing_id || null
        };
    }

    async getMessages(
        conversationId: number,
        dto: GetMessagesDto
    ): Promise<{
        messages: Message[];
        total: number;
        limit: number;
        offset: number
    }> {
        const params = new URLSearchParams({
            limit: dto.limit.toString(),
            offset: dto.offset.toString(),
        });

        return await this.request(`/chat/conversations/${conversationId}/messages?${params}`);
    }

    async sendMessage(conversationId: number, text: string): Promise<Message> {
        return await this.request(`/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
    }
}

export const chatApiService = new ChatApiService();