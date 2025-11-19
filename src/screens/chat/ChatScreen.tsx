import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/shared/constants/colors';
import { Message } from '@/types/chat';
import { socketService } from '@/services/socketService';
import { RootStackParamList } from '@/navigation/types';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
    const route = useRoute<ChatRouteProp>();
    const navigation = useNavigation();
    const { conversationId } = route.params;
    const { user, isAuthenticated } = useAuth();
    const {
        messages,
        loading,
        error,
        fetchMessages,
        sendMessage,
        addNewMessage,
        setMessages
    } = useChat();
    const [sending, setSending] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const setupSocket = useCallback(async () => {
        if (!isAuthenticated || !user) {
            return null;
        }

        try {
            const connected = await socketService.connect();
            setWsConnected(connected);

            if (connected) {
                socketService.joinRoom(conversationId);

                const handleJoinedRoom = (data: { conversationId: number }) => {
                };

                const handleNewMessage = (data: { message: Message }) => {
                    if (data.message.sender.id !== user.id) {
                        addNewMessage(data.message);
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }
                };

                const handleMessageSent = (data: { message: Message }) => {
                    setMessages((prev: Message[]) => {
                        return prev.map(msg => {
                            if (msg.id < 0 && msg.text === data.message.text) {
                                return data.message;
                            }
                            return msg;
                        });
                    });
                };

                const handleError = (data: { message: string }) => {
                    console.error('❌ Socket error:', data);
                    Alert.alert('Ошибка', data.message);
                };

                socketService.on('joinedRoom', handleJoinedRoom);
                socketService.on('newMessage', handleNewMessage);
                socketService.on('messageSent', handleMessageSent);
                socketService.on('error', handleError);

                return () => {
                    socketService.off('joinedRoom', handleJoinedRoom);
                    socketService.off('newMessage', handleNewMessage);
                    socketService.off('messageSent', handleMessageSent);
                    socketService.off('error', handleError);
                    socketService.leaveRoom(conversationId);
                };
            }
        } catch (error) {
            setWsConnected(false);
        }

        return null;
    }, [conversationId, user, isAuthenticated, addNewMessage, setMessages]);

    useEffect(() => {
        if (isAuthenticated && user) {
            loadMessages();

            const initializeSocket = async () => {
                const cleanup = await setupSocket();
                if (cleanup) {
                    cleanupRef.current = cleanup;
                }
            };

            initializeSocket();

            return () => {
                if (cleanupRef.current) {
                    cleanupRef.current();
                    cleanupRef.current = null;
                }
                socketService.disconnect();
            };
        } else {
            Alert.alert('Ошибка', 'Требуется авторизация');
            navigation.goBack();
        }
    }, [conversationId, isAuthenticated, user]);

    const loadMessages = async () => {
        try {
            await fetchMessages(conversationId, { limit: 50, offset: 0 });
        } catch (err: any) {
            console.error('❌ Error loading messages:', err);

            if (err.message?.includes('Access denied') || err.message?.includes('Conversation not found')) {
                Alert.alert(
                    'Ошибка доступа',
                    'У вас нет доступа к этому чату или чат не существует',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
            }
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!user) {
            Alert.alert('Ошибка', 'Пользователь не авторизован');
            return;
        }

        let optimisticMessage: Message | null = null;

        try {
            setSending(true);

            optimisticMessage = {
                id: -Date.now(),
                text,
                sender: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                },
                sentAt: new Date().toISOString(),
                isRead: false,
            };

            addNewMessage(optimisticMessage);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

            if (wsConnected) {
                await socketService.sendMessage(conversationId, text);
            } else {
                const sentMessage = await sendMessage(conversationId, text);

                setMessages((prev: Message[]) =>
                    prev.map(msg => msg.id === optimisticMessage!.id ? sentMessage : msg)
                );
            }

        } catch (err: any) {
            console.error('❌ Error sending message:', err);
            Alert.alert('Ошибка', 'Не удалось отправить сообщение');

            if (optimisticMessage) {
                setMessages((prev: Message[]) =>
                    prev.filter(msg => msg.id !== optimisticMessage!.id)
                );
            }
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = async () => {
        await loadMessages();
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwn = item.sender.id === user?.id;
        return <MessageBubble message={item} isOwn={isOwn} />;
    };

    if (loading && messages.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка сообщений...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefresh}
                >
                    <Text style={styles.retryButtonText}>Попробовать снова</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Индикатор подключения */}
            <View style={[
                styles.connectionStatus,
                { backgroundColor: wsConnected ? COLORS.green[500] : COLORS.red[10] }
            ]}>
                <Text style={styles.connectionText}>
                    {wsConnected ? '✅ Онлайн' : '⚠️ Оффлайн'}
                </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => `${item.id}-${item.sentAt}`}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                refreshing={loading}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Нет сообщений</Text>
                        <Text style={styles.emptySubtext}>Начните общение первым!</Text>
                    </View>
                }
            />

            <MessageInput
                onSendMessage={handleSendMessage}
                disabled={sending}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    messagesList: {
        paddingVertical: 8,
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    connectionStatus: {
        padding: 8,
        alignItems: 'center',
    },
    connectionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    errorText: {
        color: COLORS.red[50],
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.gray[500],
        fontSize: 14,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.gray[500],
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.gray[400],
    },
});