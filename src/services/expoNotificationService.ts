import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { tokenService } from './tokenService';
import { API_BASE_URL } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Правильная настройка обработчика уведомлений
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class ExpoNotificationService {
    private static instance: ExpoNotificationService;
    private currentPushToken: string | null = null;
    private readonly DEVICE_ID_STORAGE_KEY = 'unique_device_id';

    static getInstance(): ExpoNotificationService {
        if (!ExpoNotificationService.instance) {
            ExpoNotificationService.instance = new ExpoNotificationService();
        }
        return ExpoNotificationService.instance;
    }

    /**
     * Генерирует уникальный ID устройства
     */
    private async generateUniqueDeviceId(): Promise<string> {
        try {
            const timeStamp = Date.now().toString();
            const randomString = Math.random().toString(36).substring(2, 15);
            const platform = Platform.OS;
            const model = Device.modelName || 'unknown';

            const dataToHash = `${platform}_${model}_${timeStamp}_${randomString}`;

            const digest = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                dataToHash
            );

            return `device_${digest.substring(0, 16)}`;
        } catch (error) {
            console.log('Crypto fallback:', error);
            return `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
    }

    /**
     * Получает или создает уникальный ID устройства
     */
    private async getOrCreateDeviceId(): Promise<string> {
        try {
            const storedDeviceId = await AsyncStorage.getItem(this.DEVICE_ID_STORAGE_KEY);

            if (storedDeviceId) {
                return storedDeviceId;
            }

            const newDeviceId = await this.generateUniqueDeviceId();
            await AsyncStorage.setItem(this.DEVICE_ID_STORAGE_KEY, newDeviceId);

            return newDeviceId;
        } catch (error) {
            console.error('Error getting device ID:', error);
            return `device_${Date.now()}`;
        }
    }

    /**
     * Запрашивает разрешения и получает push-токен
     */
    async getPushToken(): Promise<string | null> {
        try {
            if (!Device.isDevice) {
                console.log('Push уведомления не работают на эмуляторе');
                return null;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Не получены разрешения на push уведомления');
                return null;
            }

            // Получаем projectId из Constants
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;

            if (!projectId) {
                console.warn('No projectId found in app.json');
                return null;
            }

            const token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            this.currentPushToken = token;
            console.log('Expo Push Token получен:', token);

            await AsyncStorage.setItem('last_push_token', token);

            return token;
        } catch (error) {
            console.error('Ошибка получения push токена:', error);
            return null;
        }
    }

    /**
     * Отправляет push токен на бэкенд
     */
    async sendTokenToBackend(): Promise<boolean> {
        try {
            const token = await this.getPushToken(); // Получаем Expo Push Token
            const authToken = await tokenService.getToken();

            if (!token || !authToken) {
                console.log('Push: Нет токена для отправки или пользователь не авторизован');
                return false;
            }

            const deviceId = await this.getOrCreateDeviceId();

            console.log('📤 Sending push token to /devices:', {
                deviceId,
                platform: Platform.OS,
                tokenPreview: token.substring(0, 20) + '...'
            });

            // Отправляем на специальный эндпоинт /devices
            const response = await fetch(`${API_BASE_URL}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    fcmToken: token,      // Бэкенд ожидает fcmToken
                    deviceId: deviceId,
                    platform: Platform.OS,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(errorData.message || 'Failed to send push token');
            }

            console.log('✅ Push token sent successfully to /devices');
            return true;
        } catch (error) {
            console.error('Error sending push token:', error);
            return false;
        }
    }

    /**
     * Настраивает слушатели уведомлений
     */
    setupNotificationListeners() {
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Получено уведомление:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Нажатие на уведомление:', response);

            const data = response.notification.request.content.data;
            if (data && data.screen) {
                console.log('Навигация на экран:', data.screen);
            }
        });

        return {
            notificationListener,
            responseListener
        };
    }

    /**
     * Удаляет токен (при выходе из системы)
     */
    async deleteToken(): Promise<void> {
        try {
            this.currentPushToken = null;
            await AsyncStorage.removeItem('last_push_token');
            console.log('Push токен сброшен');
        } catch (error) {
            console.error('Ошибка сброса push токена:', error);
        }
    }

    /**
     * Проверяет статус разрешений
     */
    async checkPermissions(): Promise<void> {
        const permissions = await Notifications.getPermissionsAsync();
        console.log('Push permissions:', {
            granted: permissions.granted,
            ios: permissions.ios,
            android: permissions.android
        });
    }
}

export const expoNotificationService = ExpoNotificationService.getInstance();