import {useState} from "react";

export const useNotifications = () => {
    const [enabled, setEnabled] = useState(true);
    const [mutedConversations, setMutedConversations] = useState<number[]>([]);

    const toggleNotifications = () => setEnabled(!enabled);

    const toggleMuteConversation = (conversationId: number) => {
        setMutedConversations(prev =>
            prev.includes(conversationId)
                ? prev.filter(id => id !== conversationId)
                : [...prev, conversationId]
        );
    };

    const isConversationMuted = (conversationId: number) =>
        mutedConversations.includes(conversationId);

    const shouldShowNotification = (conversationId: number) =>
        enabled && !isConversationMuted(conversationId);

    return {
        enabled,
        mutedConversations,
        toggleNotifications,
        toggleMuteConversation,
        isConversationMuted,
        shouldShowNotification
    };
};