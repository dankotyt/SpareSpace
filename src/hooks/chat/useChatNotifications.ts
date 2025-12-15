import {useState, useCallback} from "react";
import {socketService} from '@/services/socketService';
import {useChat} from '@hooks/chat/useChat';

export const useNotifications = () => {
    const { markConversationAsRead } = useChat();
    const [enabled, setEnabled] = useState(true);
    const [mutedConversations, setMutedConversations] = useState<number[]>([]);

    const toggleNotifications = () => setEnabled(!enabled);

    const toggleMuteConversation = useCallback((conversationId: number) => {
        setMutedConversations(prev =>
            prev.includes(conversationId)
                ? prev.filter(id => id !== conversationId)
                : [...prev, conversationId]
        );
    }, []);

    const isConversationMuted = useCallback((conversationId: number) =>
            mutedConversations.includes(conversationId)
        , [mutedConversations]);

    const shouldShowNotification = useCallback((conversationId: number) =>
            enabled && !isConversationMuted(conversationId)
        , [enabled, isConversationMuted]);

    const setupNotificationListeners = useCallback(() => {
        const handleNewMessage = (data: { message: any }) => {
            if (data.message?.conversationId && shouldShowNotification(data.message.conversationId)) {
                console.log('Новое сообщение:', data.message);
            }
        };

        const handleMessagesRead = (data: { conversationId: number }) => {
            if (data.conversationId) {
                markConversationAsRead(data.conversationId);
            }
        };

        socketService.on('newMessage', handleNewMessage);
        socketService.on('messagesRead', handleMessagesRead);

        return () => {
            socketService.off('newMessage', handleNewMessage);
            socketService.off('messagesRead', handleMessagesRead);
        };
    }, [shouldShowNotification, markConversationAsRead]);

    return {
        enabled,
        mutedConversations,
        toggleNotifications,
        toggleMuteConversation,
        isConversationMuted,
        shouldShowNotification,
        setupNotificationListeners
    };
};