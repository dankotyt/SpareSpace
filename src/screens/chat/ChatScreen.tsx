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
import {useChat} from "@hooks/chat/useChat";
import {useAuth} from "@hooks/auth/useAuth";
import {StackNavigationProp} from "@react-navigation/stack";
import {BackButton} from "@components/ui/BackButton";
import {formatChatSeparatorDate} from "@shared/utils/dateUtils";

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
            return null;
        }

        try {
            const connected = await socketService.connect();
            setWsConnected(connected);

            if (connected) {
                socketService.joinRoom(conversationId);

                const handleJoinedRoom = (data: { conversationId: number }) => {
                };

                const handleMessagesRead = () => {
                    socketService.markAsRead(conversationId);
                };

                const handleNewMessage = (data: { message: Message }) => {
                    if (data.message.sender.id !== user.id) {
                        addNewMessage(data.message);

                        socketService.markAsRead(conversationId);

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
                socketService.on('messagesRead', handleMessagesRead);
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
            console.error('❌ Socket setup error:', error);
        }

        return null;
    }, [conversationId, user, isAuthenticated, addNewMessage, setMessages]);

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
                socketService.disconnect();
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

        const optimisticId = -Date.now();

        try {
            setSending(true);

            const optimisticMessage: Message = {
                id: optimisticId,
                text,
                sender: user,
                sentAt: new Date().toISOString(),
                isRead: false,
            };

            addNewMessage(optimisticMessage);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

            await socketService.sendMessage(conversationId, text);

        } catch (error: any) {
            console.error('❌ Error sending message via WebSocket:', error);

            setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
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
                <BackButton onPress={handleBackPress} backgroundColor={COLORS.transparent}/>
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
            {conversationData!.listing ? (
                <PinnedAd
                    listingData={conversationData!.listing}
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