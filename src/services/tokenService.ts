import AsyncStorage from '@react-native-async-storage/async-storage';
import {expoNotificationService} from "@services/expoNotificationService";

class TokenService {
    private readonly TOKEN_KEY = 'access_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly DEVICE_ID_KEY = 'device_id';

    async saveToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(this.TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    async saveRefreshToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving refresh token:', error);
        }
    }

    async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    }

    async saveDeviceId(deviceId: string): Promise<void> {
        try {
            await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
        } catch (error) {
            console.error('Error saving device ID:', error);
        }
    }

    async getDeviceId(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.DEVICE_ID_KEY);
        } catch (error) {
            console.error('Error getting device ID:', error);
            return null;
        }
    }

    async clearTokens(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                this.TOKEN_KEY,
                this.REFRESH_TOKEN_KEY,
                this.DEVICE_ID_KEY
            ]);
            // Удаляем FCM токен при выходе
            await expoNotificationService.deleteToken();
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    }
}

export const tokenService = new TokenService();