import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';
import { useAuth } from '@hooks/auth/useAuth';
import { Linking } from 'react-native';

interface ProfileMenuProps {
    onMenuItemPress: (itemId: string) => void;
    onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
                                                            onMenuItemPress,
                                                            onLogout
                                                        }) => {
    const {
        telegramLinked,
        linkTelegramAccount,
        unlinkTelegramAccount,
        isLoading
    } = useAuth();

    const handleTelegramAction = async () => {
        if (telegramLinked) {
            Alert.alert(
                'Отвязать Telegram',
                'Вы уверены, что хотите отвязать Telegram аккаунт?',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Отвязать',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await unlinkTelegramAccount();
                                Alert.alert('Успех', 'Telegram аккаунт отвязан');
                            } catch (error) {
                                Alert.alert('Ошибка', 'Не удалось отвязать Telegram аккаунт');
                            }
                        },
                    },
                ]
            );
        } else {
            try {
                const link = await linkTelegramAccount();
                if (link) {
                    Linking.openURL(link).catch(err => {
                        console.error('Failed to open URL:', err);
                        Alert.alert('Ошибка', 'Не удалось открыть ссылку для привязки');
                    });
                }
            } catch (error) {
                Alert.alert('Ошибка', 'Не удалось сгенерировать ссылку для привязки');
            }
        }
    };

    const menuItems = [
        { id: 'ads', title: 'Мои объявления', icon: 'document-text' as const },
        { id: 'reviews', title: 'Отзывы', icon: 'star' as const },
        { id: 'favorites', title: 'Избранное', icon: 'heart' as const },
        { id: 'balance', title: 'Баланс', icon: 'wallet' as const },
        { id: 'notifications', title: 'Уведомления', icon: 'notifications' as const },
        { id: 'settings', title: 'Настройки', icon: 'settings' as const },
        {
            id: 'telegram',
            title: telegramLinked ? 'Отвязать Telegram' : 'Привязать Telegram',
            icon: telegramLinked ? 'link' as const : 'link-outline' as const,
            isTelegram: true
        },
    ];

    const handleLogoutPress = () => {
        Alert.alert(
            'Выход',
            'Вы точно хотите выйти?',
            [
                {
                    text: 'Нет',
                    style: 'cancel',
                },
                {
                    text: 'Да',
                    style: 'destructive',
                    onPress: onLogout,
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {menuItems.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => {
                        if (item.isTelegram) {
                            handleTelegramAction();
                        } else {
                            onMenuItemPress(item.id);
                        }
                    }}
                    disabled={isLoading && item.isTelegram}
                >
                    <Ionicons
                        name={item.icon}
                        size={24}
                        color={item.isTelegram ? COLORS.primary : COLORS.gray[500]}
                        style={styles.menuIcon}
                    />
                    <Text style={[
                        styles.menuTitle,
                        item.isTelegram && styles.telegramText
                    ]}>
                        {item.title}
                    </Text>
                    {isLoading && item.isTelegram && (
                        <ActivityIndicator
                            size="small"
                            color={COLORS.primary}
                            style={styles.loadingIndicator}
                        />
                    )}
                </TouchableOpacity>
            ))}
            <View style={styles.logoutContainer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogoutPress}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={20}
                        color={COLORS.red[500]}
                    />
                    <Text style={styles.logoutButtonText}>Выйти</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        marginBottom: 80,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    menuIcon: {
        width: 32,
        marginRight: 12,
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    telegramText: {
        color: COLORS.primary,
    },
    loadingIndicator: {
        marginLeft: 8,
    },
    logoutContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FED3D3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        maxWidth: 200,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.red[500],
        marginLeft: 4,
    },
});