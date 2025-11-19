import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { Conversation } from '@/types/chat';
import { COLORS } from '@/shared/constants/colors';

interface ConversationListProps {
    conversations: Conversation[];
    onConversationPress: (conversation: Conversation) => void;
    currentUserId: number;
}

export const ConversationList: React.FC<ConversationListProps> = ({
                                                                      conversations,
                                                                      onConversationPress,
                                                                      currentUserId,
                                                                  }) => {
    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participant1.id === currentUserId
            ? conversation.participant2
            : conversation.participant1;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) {
            return date.toLocaleDateString('ru-RU', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        }
    };

    const renderConversationItem = ({ item }: { item: Conversation }) => {
        const otherParticipant = getOtherParticipant(item);
        const listingTitle = item.listing?.title || 'Объявление';
        const unreadCount = item.unreadCount || 0;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => onConversationPress(item)}
            >
                <View style={styles.avatarContainer}>
                    {otherParticipant.avatar ? (
                        <Image
                            source={{ uri: otherParticipant.avatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.conversationInfo}>
                    <View style={styles.headerRow}>
                        <Text style={styles.participantName}>
                            {otherParticipant.firstName} {otherParticipant.lastName}
                        </Text>
                        <Text style={styles.timeText}>
                            {formatTime(item.lastMessageAt)}
                        </Text>
                    </View>

                    <Text style={styles.listingText} numberOfLines={1}>
                        {listingTitle}
                    </Text>

                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingVertical: 8,
    },
    conversationItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderEmpty,
    },
    avatarContainer: {
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
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    conversationInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.borderEmpty,
    },
    listingText: {
        fontSize: 14,
        color: COLORS.borderEmpty,
        marginBottom: 4,
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    unreadText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
});