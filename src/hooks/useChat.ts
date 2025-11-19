import {useCallback, useState} from 'react';
import {chatApiService} from '@/services/api/chatApi';
import {Conversation, CreateConversationDto, GetConversationsDto, GetMessagesDto, Message} from '@/types/chat';

export const useChat = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const sendMessage = useCallback(async (conversationId: number, text: string) => {
        try {
            setError(null);
            const newMessage = await chatApiService.sendMessage(conversationId, text);
            setMessages(prev => [...prev, newMessage]);
            return newMessage;
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка отправки сообщения';
            setError(errorMessage);
            throw new Error(errorMessage);
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
        sendMessage,
        addNewMessage,
        setConversations,
        setMessages,
    };
};