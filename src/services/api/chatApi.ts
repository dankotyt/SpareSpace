import { tokenService } from '@/services/tokenService';
import { API_BASE_URL } from '@/config/env';
import { Conversation, CreateConversationDto, GetConversationsDto, GetMessagesDto, Message } from '@/types/chat';

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

        if (response.status === 204) {
            return {} as T;
        }

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
        offset: number;
    }> {
        const params = new URLSearchParams({
            limit: dto.limit.toString(),
            offset: dto.offset.toString(),
        });

        return await this.request(`/chat/conversations?${params}`);
    }

    async getConversationById(conversationId: number): Promise<Conversation> {
        return await this.request<Conversation>(`/chat/conversations/${conversationId}`);
    }

    async createConversation(dto: CreateConversationDto): Promise<Conversation> {
        return await this.request<Conversation>('/chat/conversations', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    }

    async getMessages(
        conversationId: number,
        dto: GetMessagesDto
    ): Promise<{
        messages: Message[];
        total: number;
        limit: number;
        offset: number;
    }> {
        const params = new URLSearchParams({
            limit: dto.limit.toString(),
            offset: dto.offset.toString(),
        });

        return await this.request(`/chat/conversations/${conversationId}/messages?${params}`);
    }

    async deleteConversation(conversationId: number, permanent: boolean = false): Promise<void> {
        await this.request(`/chat/conversations/${conversationId}`, {
            method: 'DELETE',
            body: JSON.stringify({ permanent }),
        });
    }

    async restoreConversation(conversationId: number): Promise<void> {
        await this.request(`/chat/conversations/${conversationId}/restore`, {
            method: 'PATCH',
        });
    }
}

export const chatApiService = new ChatApiService();