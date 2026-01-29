import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator, Alert
} from 'react-native';
import { Conversation } from '@/types/chat';
import { NotificationBubble } from '@/components/chat/NotificationBubble';
import { COLORS } from '@/shared/constants/colors';
import {formatChatDate} from "@shared/utils/dateUtils";
import { socketService } from '@/services/socketService';
import { useAuth } from '@hooks/auth/useAuth';

interface ConversationListProps {
    conversations: Conversation[];
    currentUserId: number;
    loading?: boolean;
    onConversationPress: (conversationId: number) => void;
    onDeleteConversation?: (conversationId: number) => void;
    onRefresh?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
                                                                      conversations,
                                                                      currentUserId,
                                                                      loading = false,
                                                                      onConversationPress,
                                                                      onDeleteConversation,
                                                                      onRefresh,
                                                                  }) => {
    const { user } = useAuth();
    const [localConversations, setLocalConversations] = useState<Conversation[]>(conversations);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        if (!user) return;

        const handleNewMessage = (data: {
            conversationId: number;
            message: any;
        }) => {
            setLocalConversations(prev =>
                prev.map(conv => {
                    if (conv.id === data.conversationId) {
                        const isOwnMessage = data.message.sender.id === user.id;

                        return {
                            ...conv,
                            lastMessageAt: new Date().toISOString(),
                            lastMessage: {
                                text: data.message.text,
                                senderId: data.message.sender.id
                            },
                            // Увеличиваем счетчик только если сообщение не наше
                            unreadCount: isOwnMessage
                                ? (conv.unreadCount || 0)
                                : (conv.unreadCount || 0) + 1
                        };
                    }
                    return conv;
                })
            );
        };

        const handleMessageReadUpdate = (data: {
            conversationId: number;
            userId: number;
            messageIds: number[];
        }) => {
            setLocalConversations(prev =>
                prev.map(conv => {
                    if (conv.id === data.conversationId && data.userId === user.id) {
                        const messagesRead = Math.min(data.messageIds.length, conv.unreadCount || 0);
                        return {
                            ...conv,
                            unreadCount: Math.max(0, (conv.unreadCount || 0) - messagesRead)
                        };
                    }
                    return conv;
                })
            );
        };

        const handleLastMessage = (data: {
            conversationId: number;
            lastMessage: any;
        }) => {
            setLocalConversations(prev =>
                prev.map(conv => {
                    if (conv.id === data.conversationId) {
                        const isOwnMessage = data.lastMessage?.sender?.id === user.id;
                        return {
                            ...conv,
                            lastMessageAt: data.lastMessage?.sentAt || conv.lastMessageAt,
                            lastMessage: data.lastMessage ? {
                                text: data.lastMessage.text,
                                senderId: data.lastMessage.sender.id
                            } : conv.lastMessage
                        };
                    }
                    return conv;
                })
            );
        };

        const handleUnreadsCount = (data: {
            conversationId: number;
            unreadMessagesCount: number;
        }) => {
            setLocalConversations(prev =>
                prev.map(conv => {
                    if (conv.id === data.conversationId) {
                        return {
                            ...conv,
                            unreadCount: data.unreadMessagesCount
                        };
                    }
                    return conv;
                })
            );
        };

        socketService.on('message:new', handleNewMessage);
        socketService.on('message:read-update', handleMessageReadUpdate);
        socketService.on('last-message', handleLastMessage);
        socketService.on('unreads', handleUnreadsCount);

        return () => {
            socketService.off('message:new', handleNewMessage);
            socketService.off('message:read-update', handleMessageReadUpdate);
            socketService.off('last-message', handleLastMessage);
            socketService.off('unreads', handleUnreadsCount);
        };
    }, [user]);

    // Остальные функции остаются без изменений...
    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participant1.id === currentUserId
            ? conversation.participant2
            : conversation.participant1;
    };

    const getParticipantName = (conversation: Conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        return `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
    };

    const renderConversationItem = ({ item }: { item: Conversation }) => {
        const participantName = getParticipantName(item);
        const otherParticipant = getOtherParticipant(item);
        const hasUnread = (item.unreadCount || 0) > 0;

        // Безопасное получение текста последнего сообщения
        const lastMessageText = item.lastMessage?.text || 'Нет сообщений';
        const isOwnLastMessage = item.lastMessage?.senderId === currentUserId;

        // Форматируем текст для отображения
        const displayText = isOwnLastMessage
            ? `Вы: ${lastMessageText}`
            : lastMessageText;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => {
                    // При клике открываем чат и обновляем счетчик
                    onConversationPress(item.id);
                }}
                onLongPress={() => {
                    if (onDeleteConversation) {
                        onDeleteConversation(item.id);
                    }
                }}
                activeOpacity={0.7}
                delayLongPress={500}
            >
                {/* Аватар */}
                <View style={styles.avatarContainer}>
                    {otherParticipant.avatar ? (
                        <Image
                            source={{ uri: otherParticipant.avatar }}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {participantName.charAt(0)}
                            </Text>
                        </View>
                    )}

                    {/* NotificationBubble - показываем только если есть непрочитанные */}
                    {hasUnread && (
                        <NotificationBubble
                            count={item.unreadCount || 0}
                            color={COLORS.primary}
                            enabled={true}
                        />
                    )}
                </View>

                {/* Контент */}
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={[
                            styles.userName,
                            hasUnread ? styles.unreadUserName : null
                        ]} numberOfLines={1}>
                            {participantName}
                        </Text>
                        <Text style={styles.dateText}>
                            {formatChatDate(item.lastMessageAt)}
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.lastMessage,
                            hasUnread ? styles.unreadMessage : styles.readMessage
                        ]}
                        numberOfLines={2}
                    >
                        {displayText}
                    </Text>

                    {item.listing && (
                        <Text style={styles.listingText} numberOfLines={1}>
                            📍 {item.listing.title}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && localConversations.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка сообщений...</Text>
            </View>
        );
    }

    if (localConversations.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Нет сообщений</Text>
                <Text style={styles.emptySubtext}>
                    Начните общение с другими пользователями
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={localConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={onRefresh}
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingVertical: 8,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[100],
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    unreadUserName: {
        fontWeight: '700',
        color: COLORS.gray[900],
    },
    unreadMessage: {
        fontWeight: '600',
        color: COLORS.gray[900],
    },
    readMessage: {
        fontWeight: '400',
        color: COLORS.gray[600],
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray[900],
        flex: 1,
        marginRight: 8,
    },
    dateText: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.gray[600],
        lineHeight: 18,
        marginBottom: 4,
    },
    listingText: {
        fontSize: 12,
        color: COLORS.gray[500],
        fontStyle: 'italic',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.gray[500],
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.gray[500],
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.gray[400],
        textAlign: 'center',
    },
});