import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';

interface MenuItem {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
}

interface ProfileMenuProps {
    onMenuItemPress: (itemId: string) => void;
    onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onMenuItemPress, onLogout }) => {
    const menuItems: MenuItem[] = [
        { id: 'ads', title: 'Мои объявления', icon: 'document-text' },
        { id: 'reviews', title: 'Отзывы', icon: 'star' },
        { id: 'favorites', title: 'Избранное', icon: 'heart' },
        { id: 'balance', title: 'Баланс', icon: 'wallet' },
        { id: 'notifications', title: 'Уведомления', icon: 'notifications' },
        { id: 'settings', title: 'Настройки', icon: 'settings' },
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
                    onPress={() => onMenuItemPress(item.id)}
                >
                    <Ionicons name={item.icon} size={24} color="#6B7280" style={styles.menuIcon} />
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.count !== undefined && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{item.count}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
            <View style={styles.logoutContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.red[500]} />
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
        color: COLORS.gray[500],
    },
    exitIcon: {
        width: 32,
        marginRight: 12,
        color: COLORS.red[500],
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    countBadge: {
        backgroundColor: COLORS.red[500],
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    countText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
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