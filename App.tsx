import React, {useEffect, useRef, useState} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {Linking, Platform, TextInput, Text, ActivityIndicator, View} from 'react-native';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/services/AuthProvider';
import { AdvertisementProvider } from '@/services/AdvertisementContext';
import { useAuth } from '@hooks/auth/useAuth';
import { tokenService } from '@services/tokenService';
import { fcmService } from '@services/fcmService';
import {YANDEX_MAP_CONFIG} from "@/config/mapConfig";
import {YaMap} from "react-native-yamap";
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
    (Text as any).defaultProps = (Text as any).defaultProps || {};
    (Text as any).defaultProps.allowFontScaling = false;

    (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
    (TextInput as any).defaultProps.allowFontScaling = false;
}

// Используем возвращаемый тип из методов Notifications
const DeepLinkHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { updateTelegramToken } = useAuth();

    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const { url } = event;
            if (url.includes('telegram-auth-success')) {
                try {
                    const urlParams = new URLSearchParams(url.split('?')[1]);
                    const token = urlParams.get('token');
                    const telegramId = urlParams.get('telegramId');
                    if (token) {
                        await updateTelegramToken(token, telegramId || undefined);
                    }
                } catch (error) {
                    console.error('Error handling deep link:', error);
                }
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);
        Linking.getInitialURL().then(url => {
            if (url) handleDeepLink({ url });
        });

        return () => subscription.remove();
    }, [updateTelegramToken]);

    return <>{children}</>;
};

// Компонент для инициализации push уведомлений
const NotificationInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        initializeNotifications();

        return () => {
            // отписка от слушателей
            if (unsubscribeForeground) unsubscribeForeground();
            if (unsubscribeBackground) unsubscribeBackground();
        };
    }, []);

    let unsubscribeForeground: (() => void) | null = null;
    let unsubscribeBackground: (() => void) | null = null;

    const initializeNotifications = async () => {
        try {
            const token = await tokenService.getToken();

            if (token) {
                const hasPermission = await fcmService.checkPermissions();
                if (hasPermission) {
                    // Отправляем токен на бэкенд
                    const success = await fcmService.sendTokenToBackend();
                    console.log('Send token to backend:', success);

                    // Настраиваем слушатели уведомлений
                    const listeners = await fcmService.setupNotificationListeners();
                    unsubscribeForeground = listeners.unsubscribeForeground;
                    unsubscribeBackground = listeners.unsubscribeBackground;

                    // Настройка обновления токена
                    fcmService.onTokenRefresh(async (newToken) => {
                        if (newToken) {
                            await fcmService.sendTokenToBackend();
                        }
                    });
                } else {
                    console.log('Нет разрешения на уведомления');
                }
            }
        } catch (error) {
            console.error('Ошибка инициализации уведомлений:', error);
        }
    };

    return <>{children}</>;
};

export default function App() {
    const [setFontsLoaded] = useState(false);

    useEffect(() => {
        const initMap = async () => {
            try {
                if (YANDEX_MAP_CONFIG.apiKey) {
                    await YaMap.init(YANDEX_MAP_CONFIG.apiKey);
                } else {
                    console.warn('Нет API ключа');
                }
            } catch (error) {
                console.error('Ошибка при инициализации YaMap:', error);
            }
        };

        initMap();
    }, []);

    useEffect(() => {
        const loadFonts = async () => {
            await Font.loadAsync({
                ...Ionicons.font,
            });
            setFontsLoaded(true);
        };
        loadFonts();
    }, []);

    return (
        <AuthProvider>
            <AdvertisementProvider>
                <NavigationContainer
                    linking={{
                        prefixes: ['yourapp://', 'https://yourapp.com'],
                        config: {
                            screens: {
                                TelegramAuth: 'telegram-auth',
                            },
                        },
                    }}
                >
                    <DeepLinkHandler>
                        <NotificationInitializer>
                            <StatusBar style="auto" />
                            <AppNavigator />
                        </NotificationInitializer>
                    </DeepLinkHandler>
                </NavigationContainer>
            </AdvertisementProvider>
        </AuthProvider>
    );
}