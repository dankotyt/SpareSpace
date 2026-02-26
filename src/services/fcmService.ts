// import messaging from '@react-native-firebase/messaging';
// import { tokenService } from './tokenService';
// import { API_BASE_URL } from '@/config/env';
// import {Platform} from "react-native";
//
// class FCMService {
//     private static instance: FCMService;
//     private currentToken: string | null = null;
//
//     private constructor() {}
//
//     static getInstance(): FCMService {
//         if (!FCMService.instance) {
//             FCMService.instance = new FCMService();
//         }
//         return FCMService.instance;
//     }
//
//     /**
//      * Запрашивает разрешения и получает FCM токен
//      */
//     async getFCMToken(): Promise<string | null> {
//         try {
//             // Запрашиваем разрешения для iOS
//             const authStatus = await messaging().requestPermission();
//             const enabled =
//                 authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//                 authStatus === messaging.AuthorizationStatus.PROVISIONAL;
//
//             if (!enabled) {
//                 console.log('FCM: Разрешения не получены');
//                 return null;
//             }
//
//             // Получаем токен
//             const token = await messaging().getToken();
//             this.currentToken = token;
//             console.log('FCM Token получен:', token);
//             return token;
//         } catch (error) {
//             console.error('Ошибка получения FCM токена:', error);
//             return null;
//         }
//     }
//
//     /**
//      * Отправляет FCM токен на бэкенд
//      */
//     async sendTokenToBackend(deviceId?: string): Promise<boolean> {
//         try {
//             const token = await this.getFCMToken();
//             const authToken = await tokenService.getToken();
//
//             if (!token || !authToken) {
//                 console.log('FCM: Нет токена для отправки');
//                 return false;
//             }
//
//             // Получаем или создаем deviceId
//             let finalDeviceId: string;
//
//             if (deviceId) {
//                 // Если передан в параметрах, используем его
//                 finalDeviceId = deviceId;
//             } else {
//                 // Пробуем получить из хранилища
//                 const savedDeviceId = await tokenService.getDeviceId();
//                 if (savedDeviceId) {
//                     finalDeviceId = savedDeviceId;
//                 } else {
//                     // Создаем новый
//                     finalDeviceId = this.generateDeviceId();
//                     await tokenService.saveDeviceId(finalDeviceId);
//                 }
//             }
//
//             const response = await fetch(`${API_BASE_URL}/devices`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${authToken}`,
//                 },
//                 body: JSON.stringify({
//                     fcmToken: token,
//                     deviceId: finalDeviceId,  // теперь точно string
//                     platform: Platform.OS === 'ios' ? 'ios' : 'android',
//                 }),
//             });
//
//             if (!response.ok) {
//                 throw new Error('Failed to send FCM token');
//             }
//
//             console.log('FCM токен успешно отправлен на сервер');
//             return true;
//         } catch (error) {
//             console.error('Ошибка отправки FCM токена:', error);
//             return false;
//         }
//     }
//
//     /**
//      * Генерирует уникальный ID устройства
//      */
//     private generateDeviceId(): string {
//         // Можно использовать DeviceInfo или другой способ
//         return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     }
//
//     /**
//      * Обрабатывает обновление токена
//      */
//     onTokenRefresh(callback: (token: string | null) => void) {
//         return messaging().onTokenRefresh(async (token: string | null) => {
//             this.currentToken = token;
//             await this.sendTokenToBackend();
//             callback(token);
//         });
//     }
//
//     /**
//      * Удаляет FCM токен (при выходе из системы)
//      */
//     async deleteToken(): Promise<void> {
//         try {
//             await messaging().deleteToken();
//             this.currentToken = null;
//             console.log('FCM токен удален');
//         } catch (error) {
//             console.error('Ошибка удаления FCM токена:', error);
//         }
//     }
// }
//
// export const fcmService = FCMService.getInstance();