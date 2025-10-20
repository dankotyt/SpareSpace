import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';

interface UnauthorizedProfileProps {
    onLoginPress: () => void;
}

export const UnauthorizedProfile: React.FC<UnauthorizedProfileProps> = ({ onLoginPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Ionicons name="person-outline" size={40} color={COLORS.gray[400]} />
                </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
                <Text style={styles.loginButtonText}>Войти</Text>
            </TouchableOpacity>

            <Text style={styles.description}>
                Войдите в аккаунт, чтобы управлять профилем и объявлениями
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.white,
    },
    avatarContainer: {
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray[200],
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: COLORS.gray[500],
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});