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

    const setupSocket = useCallback(async () => {
        if (!isAuthenticated || !user) {
            console.log('🔐 User not authenticated');
            return null;
        }

        try {
            const connected = await socketService.connect();
            setWsConnected(connected);

            if (!connected) {
                console.error('❌ Failed to connect to WebSocket');
                Alert.alert('Ошибка', 'Не удалось подключиться к чату');
                return null;
            }

            await socketService.joinRoom(conversationId);

            const processedMessageIds = new Set<number>();

            const handleNewMessage = (data: { conversationId?: number | string; message: Message }) => {

                const normalizedMessageId = data.message.id;

                processedMessageIds.add(normalizedMessageId);

                setTimeout(() => {
                    processedMessageIds.delete(normalizedMessageId);
                }, 5 * 60 * 1000);

                if (data.message.sender.id === user.id) {
                    console.log('⏭️ Ignoring own message from broadcast');
                    return;
                }

                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === normalizedMessageId);
                    if (exists) {
                        return prev;
                    }

                    return [...prev, data.message];
                });

                socketService.markAsRead(conversationId, [normalizedMessageId]);

                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            };

            const handleMessageSent = (data: { success: boolean; data?: { message: Message } }) => {

                if (data.data?.message) {
                    const normalizedMessageId = typeof data.data.message.id === 'string' ?
                        parseInt(data.data.message.id) : data.data.message.id;

                    processedMessageIds.add(normalizedMessageId);

                    setMessages(prev => {
                        return prev.map(msg => {
                            if (msg.id < 0 &&
                                msg.sender.id === user.id &&
                                msg.text === data.data!.message.text) {
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

            socketService.on('success', handleMessageSent);
            socketService.on('message:new', handleNewMessage);
            socketService.on('error', handleError);

            return () => {
                socketService.off('success', handleMessageSent);
                socketService.off('message:new', handleNewMessage);
                socketService.off('error', handleError);
                socketService.leaveRoom(conversationId);
                processedMessageIds.clear();
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
            loadMessages();
            loadConversationData();

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
                // НЕ отключаем WebSocket полностью, только покидаем комнату
            };
        } else {
            Alert.alert('Ошибка', 'Требуется авторизация');
            navigation.goBack();
        }
    }, [conversationId, isAuthenticated, user]);

    const handleSendMessage = async (text: string) => {
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

        try {
            setSending(true);

            const optimisticConversation: Conversation = {
                id: conversationId,
                participant1: conversationData?.participant1 || user,
                participant2: conversationData?.participant2 || user,
                listing: conversationData.listing,
                lastMessageAt: new Date().toISOString()
            };

            const optimisticMessage: Message = {
                id: optimisticId,
                text,
                sender: user,
                sentAt: new Date().toISOString(),
                isRead: false,
                conversation: optimisticConversation,
                readAt: null
            };

            addNewMessage(optimisticMessage);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

            await socketService.sendMessage(conversationId, text);

        } catch (error: any) {
            console.error('❌ Error sending message:', error);

            setMessages(prev => {
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

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isOwn = item.sender.id === user?.id;
        const showDateSeparator = shouldShowDateSeparator(index);

        return (
            <View key={`${item.id}-${item.sentAt}`}>
                {showDateSeparator && renderDateSeparator(item.sentAt)}
                <MessageBubble message={item} isOwn={isOwn} />
            </View>
        );
    };

    const shouldShowDateSeparator = (currentIndex: number): boolean => {
        if (currentIndex === 0) return true;

        const currentMessage = messages[currentIndex];
        const previousMessage = messages[currentIndex - 1];

        if (!currentMessage || !previousMessage) return false;

        const currentDate = new Date(currentMessage.sentAt).toDateString();
        const previousDate = new Date(previousMessage.sentAt).toDateString();

        return currentDate !== previousDate;
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