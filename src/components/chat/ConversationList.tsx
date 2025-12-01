import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { Conversation } from '@/types/chat';
import { NotificationBubble } from '@/components/chat/NotificationBubble';
import { COLORS } from '@/shared/constants/colors';
import {formatChatDate} from "@shared/utils/dateUtils";

interface ConversationListProps {
    conversations: Conversation[];
    currentUserId: number;
    loading?: boolean;
    onConversationPress: (conversationId: number) => void;
    onRefresh?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
                                                                      conversations,
                                                                      currentUserId,
                                                                      loading = false,
                                                                      onConversationPress,
                                                                      onRefresh
                                                                  }) => {
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

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => onConversationPress(item.id)}
                activeOpacity={0.7}
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

                    {/* Уведомления о новых сообщениях */}
                    {item.unreadCount && item.unreadCount > 0 && (
                        <NotificationBubble
                            count={item.unreadCount}
                            color={COLORS.primary}
                            enabled={true}
                            onPress={() => onConversationPress(item.id)}
                        />
                    )}
                </View>

                {/* Контент */}
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {participantName}
                        </Text>
                        <Text style={styles.dateText}>
                            {formatChatDate(item.lastMessageAt)}
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.lastMessage,
                            ...(item.unreadCount && item.unreadCount > 0 ? [styles.unreadMessage] : [])
                        ]}
                        numberOfLines={2}
                    >
                        {item.lastMessage?.text || 'Нет сообщений'}
                    </Text>

                    {item.listingTitle && (
                        <Text style={styles.listingText} numberOfLines={1}>
                            📍 {item.listingTitle}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && conversations.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка сообщений...</Text>
            </View>
        );
    }

    if (conversations.length === 0) {
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
            data={conversations}
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
    unreadMessage: {
        fontWeight: '600',
        color: COLORS.gray[900],
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