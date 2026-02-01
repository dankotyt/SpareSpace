import { useCallback, useState } from 'react';
import { chatApiService } from '@services/api/chatApi';
import { Conversation, CreateConversationDto, GetConversationsDto, GetMessagesDto, Message } from '@/types/chat';

/**
 * Хук для управления чатом: беседами и сообщениями
 * Предоставляет CRUD операции для работы с чатами
 */
export const useChat = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Загружает список бесед пользователя с пагинацией
     * @param dto - DTO с параметрами запроса (лимит, оффсет)
     * @returns Промис с ответом от сервера
     */
    const fetchConversations = useCallback(async (dto: GetConversationsDto) => {
        try {
            setLoading(true);
            setError(null);
            const response = await chatApiService.getConversations(dto);
            setConversations(response.conversations);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка загрузки бесед';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Загружает сообщения конкретной беседы
     * @param conversationId - ID беседы
     * @param dto - DTO с параметрами запроса (лимит, оффсет)
     * @returns Промис с ответом от сервера
     */
    const fetchMessages = useCallback(async (conversationId: number, dto: GetMessagesDto) => {
        try {
            setLoading(true);
            setError(null);
            const response = await chatApiService.getMessages(conversationId, dto);
            setMessages(response.messages);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка загрузки сообщений';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Создает новую беседу между пользователями
     * @param dto - DTO с данными для создания беседы
     * @returns Промис с созданной беседой
     */
    const createConversation = useCallback(async (dto: CreateConversationDto) => {
        try {
            setLoading(true);
            setError(null);
            return await chatApiService.createConversation(dto);
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка создания беседы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Удаляет беседу (мягкое или полное удаление)
     * @param conversationId - ID беседы для удаления
     * @param permanent - флаг полного удаления (по умолчанию false)
     */
    const deleteConversation = useCallback(async (conversationId: number, permanent: boolean = false) => {
        try {
            setLoading(true);
            setError(null);
            await chatApiService.deleteConversation(conversationId, permanent);
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка удаления беседы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Восстанавливает мягко удаленную беседу
     * @param conversationId - ID беседы для восстановления
     */
    const restoreConversation = useCallback(async (conversationId: number) => {
        try {
            setLoading(true);
            setError(null);
            await chatApiService.restoreConversation(conversationId);
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка восстановления беседы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Добавляет новое сообщение в локальное состояние
     * @param message - объект сообщения
     */
    const addNewMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    /**
     * Обновляет существующее сообщение в локальном состоянии
     * @param messageId - ID сообщения для обновления
     * @param updates - объект с изменениями
     */
    const updateMessage = useCallback((messageId: number, updates: Partial<Message>) => {
        setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
        ));
    }, []);

    /**
     * Удаляет сообщения из локального состояния
     * @param messageIds - массив ID сообщений для удаления
     */
    const deleteMessages = useCallback((messageIds: number[]) => {
        setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
    }, []);

    return {
        conversations,
        messages,
        loading,
        error,
        fetchConversations,
        fetchMessages,
        createConversation,
        deleteConversation,
        restoreConversation,
        addNewMessage,
        updateMessage,
        deleteMessages,
        setConversations,
        setMessages,
    };
};