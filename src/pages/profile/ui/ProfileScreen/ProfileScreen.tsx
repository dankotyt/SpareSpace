import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/features/auth';
import { RootStackParamList } from '@/app/navigation/types';
import { BackButton } from '@/shared/ui/BackButton/BackButton';
import { BottomToolbar } from '@/shared/ui/BottomToolbar/BottomToolbar';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { isAuthenticated, logout } = useAuth();

    const handleLogin = () => {
        navigation.navigate('PhoneAuth');
    };

    const handleLogout = () => {
        logout();
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <BackButton onPress={navigation.goBack} />
                <Text style={styles.title}>Профиль</Text>
                <Text style={styles.subtitle}>Вы не авторизованы</Text>
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Войти</Text>
                </TouchableOpacity>
                <BottomToolbar />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Профиль</Text>
            <Text style={styles.subtitle}>Вы авторизованы</Text>
            <Text style={styles.userInfo}>Добро пожаловать!</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Выйти</Text>
            </TouchableOpacity>
            <BottomToolbar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    userInfo: {
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    loginButton: {
        backgroundColor: '#631BFF',
        padding: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});