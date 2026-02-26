import { tokenService } from "@services/tokenService";
import { expoNotificationService } from "@services/expoNotificationService";
import { RegistrationData, LoginCredentials } from '@/types/auth';
import { API_BASE_URL } from '@/config/env';
import { Platform } from 'react-native';

console.log('🔗 Using API URL:', API_BASE_URL);

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
}

class AuthApiService {

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            console.log(`🌐 Making request to: ${url}`);
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Получает FCM токен и информацию об устройстве
     */
    private async getDeviceInfo() {
        try {
            const pushToken = await expoNotificationService.getPushToken(); // Используем notificationService
            return {
                fcmToken: pushToken, // Отправляем как fcmToken для совместимости с бэкендом
                deviceId: await this.getDeviceId(),
                platform: Platform.OS,
            };
        } catch (error) {
            console.error('Error getting device info:', error);
            return {
                fcmToken: null,
                deviceId: null,
                platform: Platform.OS,
            };
        }
    }

    /**
     * Получает или генерирует ID устройства
     */
    private async getDeviceId(): Promise<string> {
        // Здесь можно использовать react-native-device-info
        // или другой способ получения уникального ID
        const savedDeviceId = await tokenService.getDeviceId();
        if (savedDeviceId) {
            return savedDeviceId;
        }
        const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await tokenService.saveDeviceId(newDeviceId);
        return newDeviceId;
    }

    async checkPhone(phoneData: { phone: string }): Promise<{ exists: boolean }> {
        return this.request<{ exists: boolean }>('/auth/check-phone-login', {
            method: 'POST',
            body: JSON.stringify(phoneData),
        });
    }

    async register(userData: RegistrationData): Promise<ApiResponse> {
        const { confirmPassword, firstName, lastName, patronymic, ...restData } = userData;

        // Получаем информацию об устройстве
        const deviceInfo = await this.getDeviceInfo();

        const apiData = {
            ...restData,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            patronymic: patronymic?.trim() || undefined,
            // Добавляем информацию об устройстве
            deviceId: deviceInfo.deviceId,
            fcmToken: deviceInfo.fcmToken,
            platform: deviceInfo.platform,
        };

        console.log('📤 Sending registration data to backend:', {
            ...apiData,
            fcmToken: apiData.fcmToken ? '[FCM_TOKEN]' : null
        });

        const response = await this.request<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(apiData),
        });

        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
            if (response.refreshToken) {
                await tokenService.saveRefreshToken(response.refreshToken);
            }

            if (!deviceInfo.fcmToken && deviceInfo.deviceId) {
                setTimeout(() => {
                    expoNotificationService.sendTokenToBackend();
                }, 1000);
            } else if (!deviceInfo.deviceId) {
                console.log('⚠️ Нет deviceId для отправки FCM токена');
            }

            console.log('✅ Registration token saved');
        }

        return {
            success: true,
            message: 'Регистрация успешна',
            data: response,
            token: response.accessToken,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
        };
    }

    async login(credentials: LoginCredentials): Promise<ApiResponse> {
        console.log('📤 Sending login data to backend:', {
            ...credentials,
            password: '[HIDDEN]'
        });

        // ШАГ 1: Только email и пароль для логина
        const response = await this.request<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
                // НИКАКИХ deviceId, fcmToken, platform!
            }),
        });

        if (response.accessToken) {
            // Сохраняем токены
            await tokenService.saveToken(response.accessToken);
            if (response.refreshToken) {
                await tokenService.saveRefreshToken(response.refreshToken);
            }

            console.log('✅ Login successful, token saved');

            // ШАГ 2: Отдельно отправляем push-токен на /devices
            // Не блокируем ответ, делаем после логина
            this.registerDeviceAfterLogin().catch(err =>
                console.error('Background device registration failed:', err)
            );
        }

        return {
            success: true,
            message: 'Вход выполнен успешно',
            data: response,
            token: response.accessToken,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
        };
    }

    private async registerDeviceAfterLogin(): Promise<void> {
        try {
            // Небольшая задержка, чтобы не нагружать сразу после логина
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Получаем информацию об устройстве
            const deviceInfo = await this.getDeviceInfo();

            if (!deviceInfo.fcmToken || !deviceInfo.deviceId) {
                console.log('⚠️ No device info available');
                return;
            }

            const authToken = await tokenService.getToken();
            if (!authToken) {
                console.log('⚠️ No auth token available');
                return;
            }

            console.log('📤 Registering device with /devices:', {
                deviceId: deviceInfo.deviceId,
                platform: deviceInfo.platform,
                hasToken: !!deviceInfo.fcmToken
            });

            // Отправляем на специальный эндпоинт /devices
            const response = await fetch(`${API_BASE_URL}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    fcmToken: deviceInfo.fcmToken,
                    deviceId: deviceInfo.deviceId,
                    platform: deviceInfo.platform,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register device');
            }

            console.log('✅ Device registered successfully');
        } catch (error) {
            console.error('❌ Failed to register device:', error);
        }
    }

    async getProfile(): Promise<ApiResponse> {
        const token = await tokenService.getToken();

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return {
            success: true,
            data: responseData,
        };
    }

    /**
     * Обновляет FCM токен отдельно (если нужно)
     */
    async updateFCMToken(): Promise<boolean> {
        return expoNotificationService.sendTokenToBackend();
    }
}

export const authApiService = new AuthApiService();