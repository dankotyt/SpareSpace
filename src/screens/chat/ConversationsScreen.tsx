import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ConversationList } from '@/components/chat/ConversationList';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { Conversation } from '@/types/chat';
import {useChat} from "@hooks/chat/useChat";
import {useAuth} from "@hooks/auth/useAuth";

type ChatStackParamList = {
    Chat: { conversationId: number };
    Auth: undefined;
};

type NavigationProp = StackNavigationProp<ChatStackParamList>;

export const ConversationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, isAuthenticated } = useAuth();
    const { conversations, loading, error, fetchConversations } = useChat();
    const [refreshing, setRefreshing] = useState(false);

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

    const handleRefresh = async () => {
        if (!isAuthenticated) return;

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