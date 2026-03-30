import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {Linking, Platform, TextInput, Text} from 'react-native';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/services/AuthProvider';
import { AdvertisementProvider } from '@/services/AdvertisementContext';
import { useAuth } from '@hooks/auth/useAuth';
import { expoNotificationService } from '@services/expoNotificationService';
import { tokenService } from '@services/tokenService';
import * as Notifications from 'expo-notifications';
import {YANDEX_MAP_CONFIG} from "@/config/mapConfig";
import {YaMap} from "react-native-yamap";

if (Platform.OS === 'android') {
    (Text as any).defaultProps = (Text as any).defaultProps || {};
    (Text as any).defaultProps.allowFontScaling = false;

    (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
    (TextInput as any).defaultProps.allowFontScaling = false;
}

if (YANDEX_MAP_CONFIG.apiKey) {
    YaMap.init(YANDEX_MAP_CONFIG.apiKey);
    console.log('✅ Yandex Maps initialized');
} else {
    console.warn('⚠️ Yandex Maps API key not found');
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
    // Используем ReturnType для получения правильного типа
    const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | undefined>(undefined);
    const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined>(undefined);
    useEffect(() => {
        initializeNotifications();

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    const initializeNotifications = async () => {
        try {
            const token = await tokenService.getToken();

            if (token) {
                await expoNotificationService.checkPermissions();

                // Отправляем токен на бэкенд
                const success = await expoNotificationService.sendTokenToBackend();
                console.log('Send token to backend:', success);

                // Настраиваем слушатели уведомлений
                const listeners = expoNotificationService.setupNotificationListeners();
                notificationListener.current = listeners.notificationListener;
                responseListener.current = listeners.responseListener;

                // Для Android: создаем канал уведомлений
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'default',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#FF231F7C',
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка инициализации уведомлений:', error);
        }
    };

    return <>{children}</>;
};

export default function App() {
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