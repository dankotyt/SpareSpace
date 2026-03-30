import messaging from '@react-native-firebase/messaging';
import { tokenService } from './tokenService';
import { API_BASE_URL } from '@/config/env';
import { Platform } from 'react-native';

class FCMService {
    private static instance: FCMService;
    private currentToken: string | null = null;

    private constructor() {}

    static getInstance(): FCMService {
        if (!FCMService.instance) {
            FCMService.instance = new FCMService();
        }
        return FCMService.instance;
    }

    async getFCMToken(): Promise<string | null> {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                console.log('FCM: Разрешения не получены');
                return null;
            }

            const token = await messaging().getToken();
            this.currentToken = token;
            console.log('FCM Token получен:', token);
            return token;
        } catch (error) {
            console.error('Ошибка получения FCM токена:', error);
            return null;
        }
    }

    async sendTokenToBackend(deviceId?: string): Promise<boolean> {
        try {
            const token = await this.getFCMToken();
            const authToken = await tokenService.getToken();

            if (!token || !authToken) {
                console.log('FCM: Нет токена для отправки');
                return false;
            }

            let finalDeviceId: string;

            if (deviceId) {
                finalDeviceId = deviceId;
            } else {
                const savedDeviceId = await tokenService.getDeviceId();
                if (savedDeviceId) {
                    finalDeviceId = savedDeviceId;
                } else {
                    finalDeviceId = this.generateDeviceId();
                    await tokenService.saveDeviceId(finalDeviceId);
                }
            }

            const response = await fetch(`${API_BASE_URL}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    fcmToken: token,
                    deviceId: finalDeviceId,
                    platform: Platform.OS === 'ios' ? 'ios' : 'android',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send FCM token');
            }

            console.log('FCM токен успешно отправлен на сервер');
            return true;
        } catch (error) {
            console.error('Ошибка отправки FCM токена:', error);
            return false;
        }
    }

    async deleteToken(): Promise<void> {
        try {
            await messaging().deleteToken();
            this.currentToken = null;
            console.log('FCM токен удален');
        } catch (error) {
            console.error('Ошибка удаления FCM токена:', error);
        }
    }

    onTokenRefresh(callback: (token: string | null) => void) {
        return messaging().onTokenRefresh(async (token: string | null) => {
            this.currentToken = token;
            await this.sendTokenToBackend();
            callback(token);
        });
    }

    private generateDeviceId(): string {
        return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Новые методы для обработки уведомлений
    async setupNotificationListeners() {
        // Слушатель, когда приложение на переднем плане
        const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
            console.log('Получено FCM сообщение на переднем плане:', remoteMessage);
            // Здесь можно показать локальное уведомление через Notifee или другой инструмент
        });

        // Слушатель, когда приложение открыто через уведомление (из фона)
        const unsubscribeBackground = messaging().onNotificationOpenedApp(async (remoteMessage) => {
            console.log('Приложение открыто через уведомление:', remoteMessage);
        });

        // Проверка, если приложение было закрыто, а открыто через уведомление
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
            console.log('Приложение запущено из закрытого состояния через уведомление:', initialNotification);
        }

        return {
            unsubscribeForeground,
            unsubscribeBackground,
        };
    }

    async checkPermissions(): Promise<boolean> {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
    }
}

export const fcmService = FCMService.getInstance();