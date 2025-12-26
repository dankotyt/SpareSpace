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
import { PinnedAd } from '@/components/chat/PinnedAd';
import { COLORS } from '@/shared/constants/colors';
import { Message, Conversation } from '@/types/chat';
import { socketService } from '@/services/socketService';
import { chatApiService } from '@/services/api/chatApi';
import { profileApiService } from '@/services/api/profileApi';
import { RootStackParamList } from '@/navigation/types';
import { useChat } from "@hooks/chat/useChat";
import { useAuth } from "@hooks/auth/useAuth";
import { StackNavigationProp } from "@react-navigation/stack";
import { BackButton } from "@components/ui/BackButton";
import { formatChatSeparatorDate } from "@shared/utils/dateUtils";

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
    const route = useRoute<ChatRouteProp>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { conversationId } = route.params;
    const { user, isAuthenticated } = useAuth();

    const {
        messages,
        loading: messagesLoading,
        error,
        fetchMessages,
        addNewMessage,
        setMessages
    } = useChat();

    const [sending, setSending] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [conversationData, setConversationData] = useState<Conversation>();
    const [loadingConversation, setLoadingConversation] = useState(true);
    const [participantData, setParticipantData] = useState<any>(null);

    const flatListRef = useRef<FlatList>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const loadConversationData = useCallback(async () => {
        if (!conversationId || !user) return;

        try {
            setLoadingConversation(true);
            const data = await chatApiService.getConversationById(conversationId);
            setConversationData(data);

            const otherParticipantId = data.participant1.id === user.id
                ? data.participant2.id
                : data.participant1.id;

            if (otherParticipantId) {
                try {
                    const participant = await profileApiService.getPublicUserProfile(otherParticipantId);
                    setParticipantData(participant);
                } catch (error) {
                    console.error('Error loading participant data:', error);
                }
            }

        } catch (error) {
            console.error('Error loading conversation data:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить данные диалога');
        } finally {
            setLoadingConversation(false);
        }
    }, [conversationId, user]);

    const loadMessages = useCallback(async () => {
        try {
            await fetchMessages(conversationId, { limit: 50, offset: 0 });
        } catch (err: any) {
            console.error('❌ Error loading messages:', err);
            Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
        }
    }, [conversationId, fetchMessages]);

    // В ChatScreen.tsx
    const setupSocket = useCallback(async () => {
        if (!isAuthenticated || !user) {
            console.log('🔐 User not authenticated');
            return null;
        }

        try {
            console.log('🔄 Setting up WebSocket...');

            // Подключаемся к WebSocket
            const connected = await socketService.connect();
            setWsConnected(connected);

            if (!connected) {
                console.error('❌ Failed to connect to WebSocket');
                Alert.alert('Ошибка', 'Не удалось подключиться к чату');
                return null;
            }

            console.log('✅ WebSocket connected, joining room:', conversationId);

            // Присоединяемся к комнате
            await socketService.joinRoom(conversationId);

            // Используем useRef для отслеживания обработанных сообщений
            const processedMessageIds = useRef<Set<number>>(new Set());

            const handleNewMessage = (data: { conversationId?: number; message: Message }) => {
                console.log('📥 New message received from socket:', {
                    conversationId: data.conversationId,
                    messageId: data.message.id,
                    text: data.message.text,
                    senderId: data.message.sender.id,
                    isFromMe: data.message.sender.id === user.id
                });

                // ВАЖНО: Проверяем, для нашей ли беседы это сообщение
                const eventConversationId = data.conversationId ? parseInt(data.conversationId.toString()) : null;
                if (eventConversationId !== conversationId) {
                    console.log('⏭️ Message for different conversation, skipping');
                    return;
                }

                // Проверяем, не обработали ли мы уже это сообщение
                if (processedMessageIds.current.has(data.message.id)) {
                    console.log('⏭️ Message already processed, skipping');
                    return;
                }

                // Добавляем ID в обработанные
                processedMessageIds.current.add(data.message.id);

                // Очищаем старые ID через 5 минут
                setTimeout(() => {
                    processedMessageIds.current.delete(data.message.id);
                }, 5 * 60 * 1000);

                // ИГНОРИРУЕМ сообщения от самого себя через broadcast
                // Они уже добавлены как оптимистичные
                if (data.message.sender.id === user.id) {
                    console.log('⏭️ Ignoring own message from broadcast');
                    return;
                }

                // Для сообщений от других пользователей
                setMessages(prev => {
                    // Проверяем, нет ли уже такого сообщения
                    const exists = prev.some(msg => msg.id === data.message.id);
                    if (exists) {
                        console.log('⏭️ Message already exists in list, skipping');
                        return prev;
                    }

                    console.log('✅ Adding message to list');
                    return [...prev, data.message];
                });

                // Помечаем как прочитанное
                socketService.markAsRead(conversationId, [data.message.id]);

                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            };

            const handleMessageSent = (data: { success: boolean; data?: { message: Message } }) => {
                console.log('✅ Message sent response:', data);

                if (data.data?.message) {
                    // Добавляем ID в обработанные
                    processedMessageIds.current.add(data.data.message.id);

                    // Заменяем оптимистичное сообщение на реальное
                    setMessages(prev => {
                        return prev.map(msg => {
                            // Ищем оптимистичное сообщение с таким же текстом от этого пользователя
                            if (msg.id < 0 &&
                                msg.sender.id === user.id &&
                                msg.text === data.data!.message.text) {
                                console.log('🔄 Replacing optimistic message with real one');
                                return data.data!.message;
                            }
                            return msg;
                        });
                    });
                }
            };

            const handleError = (data: { message: string }) => {
                console.error('❌ Socket error:', data);
                Alert.alert('Ошибка', data.message || 'Ошибка соединения');
            };

            // Подписываемся на события
            socketService.on('success', handleMessageSent);
            socketService.on('message:new', handleNewMessage);
            socketService.on('error', handleError);

            return () => {
                console.log('🧹 Cleaning up WebSocket listeners for conversation:', conversationId);
                socketService.off('success', handleMessageSent);
                socketService.off('message:new', handleNewMessage);
                socketService.off('error', handleError);
                socketService.leaveRoom(conversationId);
                processedMessageIds.current.clear();
            };

        } catch (error) {
            console.error('❌ Socket setup error:', error);
            setWsConnected(false);
            Alert.alert('Ошибка', 'Ошибка настройки соединения');
            return null;
        }
    }, [conversationId, user, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('🎬 Initializing chat for conversation:', conversationId);

            // Загружаем данные
            loadMessages();
            loadConversationData();

            // Настраиваем WebSocket
            const initializeSocket = async () => {
                const cleanup = await setupSocket();
                if (cleanup) {
                    cleanupRef.current = cleanup;
                }
            };

            initializeSocket();

            return () => {
                console.log('🧼 Cleaning up chat for conversation:', conversationId);
                if (cleanupRef.current) {
                    cleanupRef.current();
                    cleanupRef.current = null;
                }
                // НЕ отключаем WebSocket полностью, только покидаем комнату
            };
        } else {
            Alert.alert('Ошибка', 'Требуется авторизация');
            navigation.goBack();
        }
    }, [conversationId, isAuthenticated, user]);

    const handleSendMessage = async (text: string) => {
        console.log('🔄 handleSendMessage called with text:', text);

        if (!user) {
            Alert.alert('Ошибка', 'Пользователь не авторизован');
            return;
        }

        if (!wsConnected) {
            Alert.alert('Ошибка', 'Нет подключения к чату');
            return;
        }

        if (!conversationData) {
            console.error('❌ conversationData is undefined');
            Alert.alert('Ошибка', 'Данные беседы не загружены');
            return;
        }

        const optimisticId = -Date.now();
        console.log('📝 Creating optimistic message with ID:', optimisticId);

        try {
            setSending(true);

            // Создаем упрощенный объект conversation для оптимистичного сообщения
            const optimisticConversation: Conversation = {
                id: conversationId,
                participant1: conversationData?.participant1 || user,
                participant2: conversationData?.participant2 || user,
                listing: conversationData.listing,
                lastMessageAt: new Date().toISOString()
            };

            // Добавляем оптимистичное сообщение
            const optimisticMessage: Message = {
                id: optimisticId,
                text,
                sender: user,
                sentAt: new Date().toISOString(),
                isRead: false,
                conversation: optimisticConversation,
                readAt: null
            };

            console.log('➕ Adding optimistic message:', optimisticMessage.text);
            addNewMessage(optimisticMessage);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

            // Отправляем через WebSocket
            console.log('📤 Sending via WebSocket...');
            await socketService.sendMessage(conversationId, text);
            console.log('✅ Message sent via WebSocket');

        } catch (error: any) {
            console.error('❌ Error sending message:', error);

            // Удаляем оптимистичное сообщение при ошибке
            setMessages(prev => {
                console.log('🗑️ Removing optimistic message due to error');
                return prev.filter(msg => msg.id !== optimisticId);
            });

            Alert.alert('Ошибка', 'Не удалось отправить сообщение');
        } finally {
            setSending(false);
        }
    };

    const getParticipantName = () => {
        if (!conversationData || !user) return 'Пользователь';

        const otherParticipant = conversationData.participant1.id === user.id
            ? conversationData.participant2
            : conversationData.participant1;

        return `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {};

        messages.forEach(message => {
            const date = new Date(message.sentAt).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });

        return groups;
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleAdPress = () => {
        if (conversationData?.listing) {
            navigation.navigate('Advertisement', {
                listingId: conversationData.listing.id
            });
        }
    };

    const handleUserProfilePress = () => {
        if (conversationData && user) {
            const otherParticipantId = conversationData.participant1.id === user.id
                ? conversationData.participant2.id
                : conversationData.participant1.id;

            navigation.navigate('Profile', {
                userId: otherParticipantId
            });
        }
    };

    const handleRefresh = async () => {
        await loadMessages();
        await loadConversationData();
    };

    const renderDateSeparator = (dateString: string) => {
        const displayDate = formatChatSeparatorDate(dateString);

        return (
            <View style={styles.dateSeparator}>
                <View style={styles.dateSeparatorLine} />
                <Text style={styles.dateSeparatorText}>{displayDate}</Text>
                <View style={styles.dateSeparatorLine} />
            </View>
        );
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwn = item.sender.id === user?.id;
        return <MessageBubble message={item} isOwn={isOwn} />;
    };

    const isLoading = messagesLoading || loadingConversation;

    if (isLoading && messages.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка чата...</Text>
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
            {/* Хедер */}
            <View style={styles.header}>
                <BackButton onPress={handleBackPress} backgroundColor={COLORS.transparent} />
                <TouchableOpacity
                    style={styles.headerInfo}
                    onPress={handleUserProfilePress}
                    activeOpacity={0.7}
                >
                    <Text style={styles.headerName}>
                        {getParticipantName()}
                    </Text>
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: wsConnected ? COLORS.green[500] : COLORS.gray[400] }
                        ]} />
                        <Text style={styles.statusText}>
                            {wsConnected ? 'онлайн' : 'оффлайн'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Закрепленное объявление */}
            {conversationData?.listing ? (
                <PinnedAd
                    listingData={conversationData.listing}
                    onPress={handleAdPress}
                />
            ) : (
                <View style={styles.noAdContainer}>
                    <Text style={styles.noAdText}>Объявление не найдено</Text>
                </View>
            )}

            {/* Список сообщений */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => `${item.id}-${item.sentAt}`}
                contentContainerStyle={[
                    styles.messagesList,
                    { paddingTop: conversationData?.listing ? 0 : 8 }
                ]}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                onLayout={() => flatListRef.current?.scrollToEnd()}
                refreshing={isLoading}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Нет сообщений</Text>
                        <Text style={styles.emptySubtext}>Начните общение первым!</Text>
                    </View>
                }
                ListHeaderComponent={() => {
                    const groups = groupMessagesByDate(messages);
                    return Object.keys(groups).map(date => (
                        <View key={date}>
                            {renderDateSeparator(date)}
                            {groups[date].map(message => (
                                <MessageBubble
                                    key={`${message.id}-${message.sentAt}`}
                                    message={message}
                                    isOwn={message.sender.id === user?.id}
                                />
                            ))}
                        </View>
                    ));
                }}
            />

            {/* Поле ввода */}
            <MessageInput
                onSendMessage={handleSendMessage}
                disabled={sending || !wsConnected}
            />
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
        marginTop: 50,
    },
    headerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray[900],
        marginBottom: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexGrow: 1,
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
    errorText: {
        color: COLORS.red[50],
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
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
    noAdContainer: {
        padding: 12,
        marginHorizontal: 12,
        backgroundColor: COLORS.gray[100],
        borderRadius: 8,
        alignItems: 'center',
    },
    noAdText: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.gray[300],
    },
    dateSeparatorText: {
        paddingHorizontal: 12,
        fontSize: 12,
        color: COLORS.gray[500],
        fontWeight: '500',
    },
});