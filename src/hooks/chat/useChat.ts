import {useCallback, useState} from 'react';
import {chatApiService} from '@services/api/chatApi';
import {Conversation, CreateConversationDto, GetConversationsDto, GetMessagesDto, Message} from '@/types/chat';
import {socketService} from "@services/socketService";

export const useChat = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

    const fetchConversations = useCallback(async (dto: GetConversationsDto) => {
        try {
            setLoading(true);
            setError(null);
            const response = await chatApiService.getConversations(dto);
            setConversations(response.conversations);

            const newUnreadCounts: Record<number, number> = {};
            response.conversations.forEach(conv => {
                if (conv.unreadCount) {
                    newUnreadCounts[conv.id] = conv.unreadCount;
                }
            });
            setUnreadCounts(prev => ({ ...prev, ...newUnreadCounts }));

            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка загрузки бесед';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const deleteConversation = useCallback(async (conversationId: number) => {
        try {
            setLoading(true);
            setError(null);
            await chatApiService.deleteConversation(conversationId);

            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка удаления беседы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const addNewMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    return {
        conversations,
        messages,
        loading,
        error,
        fetchConversations,
        fetchMessages,
        createConversation,
        addNewMessage,
        unreadCounts,
        setConversations,
        setMessages,
        deleteConversation,
    };
};