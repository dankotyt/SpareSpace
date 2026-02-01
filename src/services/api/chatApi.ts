import { tokenService } from '@/services/tokenService';
import { API_BASE_URL } from '@/config/env';
import { Conversation, CreateConversationDto, GetConversationsDto, GetMessagesDto, Message } from '@/types/chat';

/**
 * Сервис для работы с API чата
 * Предоставляет операции для управления беседами и сообщениями
 */
class ChatApiService {

    /**
     * Базовый метод для выполнения авторизованных HTTP запросов к API чата
     * @param endpoint - конечная точка API
     * @param options - опции запроса fetch
     * @returns Промис с данными ответа
     * @throws Error при отсутствии токена или ошибке сервера
     */
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

    /**
     * Получает список бесед пользователя с пагинацией
     * @param dto - DTO с параметрами пагинации
     * @returns Промис со списком бесед и метаданными
     */
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

    /**
     * Получает конкретную беседу по ID
     * @param conversationId - ID беседы
     * @returns Промис с данными беседы
     */
    async getConversationById(conversationId: number): Promise<Conversation> {
        return await this.request<Conversation>(`/chat/conversations/${conversationId}`);
    }

    /**
     * Создает новую беседу между пользователями
     * @param dto - DTO с данными для создания беседы
     * @returns Промис с созданной беседой
     */
    async createConversation(dto: CreateConversationDto): Promise<Conversation> {
        return await this.request<Conversation>('/chat/conversations', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    }

    /**
     * Получает сообщения беседы с пагинацией
     * @param conversationId - ID беседы
     * @param dto - DTO с параметрами пагинации
     * @returns Промис со списком сообщений и метаданными
     */
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

    /**
     * Удаляет беседу (мягкое или полное удаление)
     * @param conversationId - ID беседы для удаления
     * @param permanent - флаг полного удаления
     */
    async deleteConversation(conversationId: number, permanent: boolean = false): Promise<void> {
        await this.request(`/chat/conversations/${conversationId}`, {
            method: 'DELETE',
            body: JSON.stringify({ permanent }),
        });
    }

    /**
     * Восстанавливает мягко удаленную беседу
     * @param conversationId - ID беседы для восстановления
     */
    async restoreConversation(conversationId: number): Promise<void> {
        await this.request(`/chat/conversations/${conversationId}/restore`, {
            method: 'PATCH',
        });
    }
}

export const chatApiService = new ChatApiService();