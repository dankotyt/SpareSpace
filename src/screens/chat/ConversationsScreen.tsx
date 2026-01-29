import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ConversationList } from '@/components/chat/ConversationList';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import {useChat} from "@hooks/chat/useChat";
import {useAuth} from "@hooks/auth/useAuth";
import { socketService } from '@/services/socketService';
import {Conversation} from "@/types/chat";

type ChatStackParamList = {
    Chat: { conversationId: number };
    Auth: undefined;
};

type NavigationProp = StackNavigationProp<ChatStackParamList>;

export const ConversationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, isAuthenticated } = useAuth();
    const { conversations, loading, error, fetchConversations, deleteConversation, setConversations } = useChat();
    const [refreshing, setRefreshing] = useState(false);
    const conversationsRef = useRef<Conversation[]>([]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        if (isAuthenticated) {
            loadConversations();
        }
    }, [isAuthenticated]);

    const loadConversations = async () => {
        try {
            await fetchConversations({ limit: 20, offset: 0 });
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const handleNewMessage = (data: {
            conversationId: number;
            message: any;
        }) => {

            setConversations(prev => {
                const updated = prev.map(conv => {
                    if (conv.id === data.conversationId) {
                        const isOwnMessage = data.message.sender.id === user.id;
                        return {
                            ...conv,
                            lastMessageAt: new Date().toISOString(),
                            lastMessage: {
                                text: data.message.text,
                                senderId: data.message.sender.id
                            },
                            unreadCount: isOwnMessage
                                ? conv.unreadCount
                                : (conv.unreadCount || 0) + 1
                        };
                    }
                    return conv;
                });

                return updated.sort((a, b) =>
                    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                );
            });
        };

        const handleMessageReadUpdate = (data: {
            conversationId: number;
            userId: number;
            messageIds: number[];
        }) => {
            if (data.userId === user.id) {
                setConversations(prev => {
                    return prev.map(conv => {
                        if (conv.id === data.conversationId) {
                            // Уменьшаем счетчик на количество прочитанных сообщений
                            const messagesRead = Math.min(data.messageIds.length, conv.unreadCount || 0);
                            return {
                                ...conv,
                                unreadCount: Math.max(0, (conv.unreadCount || 0) - messagesRead)
                            };
                        }
                        return conv;
                    });
                });
            }
        };

        const handleUnreadsCount = (data: {
            conversationId: number;
            unreadMessagesCount: number;
        }) => {

            setConversations(prev =>
                prev.map(conv =>
                    conv.id === data.conversationId
                        ? { ...conv, unreadCount: data.unreadMessagesCount }
                        : conv
                )
            );
        };

        const handleLastMessage = (data: {
            conversationId: number;
            lastMessage: any;
        }) => {

            setConversations(prev => {
                return prev.map(conv => {
                    if (conv.id === data.conversationId) {
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
                });
            });
        };

        socketService.on('message:new', handleNewMessage);
        socketService.on('message:read-update', handleMessageReadUpdate);
        socketService.on('unreads', handleUnreadsCount);
        socketService.on('last-message', handleLastMessage);

        return () => {
            socketService.off('message:new', handleNewMessage);
            socketService.off('message:read-update', handleMessageReadUpdate);
            socketService.off('unreads', handleUnreadsCount);
            socketService.off('last-message', handleLastMessage);
        };
    }, [isAuthenticated, user, setConversations]);

    const handleRefresh = async () => {
        if (!isAuthenticated) return;

        console.log('🔄 Manual refresh triggered');
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

    const handleConversationPress = (conversationId: number) => {
        if (!isAuthenticated) {
            return;
        }
        navigation.navigate('Chat', { conversationId: conversationId });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleAuthPress = () => {
        navigation.navigate('Auth');
    };

    const handleDeleteConversation = useCallback(async (conversationId: number) => {
        Alert.alert(
            'Удалить чат',
            'Вы уверены, что хотите удалить этот чат?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Мягкое удаление',
                    onPress: async () => {
                        try {
                            await deleteConversation(conversationId, false);
                        } catch (error) {
                            console.error('Error deleting conversation:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить чат');
                        }
                    }
                },
                {
                    text: 'Полное удаление',
                    style: 'destructive',
                    onPress: async () => {
                        Alert.alert(
                            'Внимание',
                            'Вы уверены, что хотите полностью удалить чат? Это действие необратимо.',
                            [
                                { text: 'Отмена', style: 'cancel' },
                                {
                                    text: 'Удалить',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            await deleteConversation(conversationId, true);
                                        } catch (error) {
                                            console.error('Error permanently deleting conversation:', error);
                                            Alert.alert('Ошибка', 'Не удалось удалить чат');
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    }, [deleteConversation]);

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <BackButton onPress={handleBackPress} backgroundColor={COLORS.transparent}/>
                    <Text style={styles.headerTitle}>Сообщения</Text>
                </View>

                <View style={styles.centered}>
                    <Text style={styles.unauthorizedText}>
                        Вы не авторизованы.{'\n'}Войдем в аккаунт?
                    </Text>
                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={handleAuthPress}
                    >
                        <Text style={styles.authButtonText}>Авторизоваться</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <BackButton onPress={handleBackPress} />
                    <Text style={styles.headerTitle}>Сообщения</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <BackButton onPress={handleBackPress} />
                    <Text style={styles.headerTitle}>Сообщения</Text>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={handleBackPress} backgroundColor={COLORS.transparent}/>
                <Text style={styles.headerTitle}>Сообщения</Text>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>Нет сообщений</Text>
                </View>
            ) : (
                <ConversationList
                    conversations={conversations}
                    currentUserId={user?.id || 0}
                    onConversationPress={handleConversationPress}
                    onDeleteConversation={handleDeleteConversation}
                    loading={loading}
                    onRefresh={handleRefresh}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderEmpty,
        marginTop: 50,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        flex: 1,
        marginRight: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        color: COLORS.red[50],
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    unauthorizedText: {
        color: COLORS.text,
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    authButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 160,
    },
    authButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});