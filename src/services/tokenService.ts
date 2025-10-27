import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const tokenService = {
    async saveToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            console.log('✅ Token saved successfully');
        } catch (error) {
            console.error('❌ Failed to save token:', error);
            throw new Error('Не удалось сохранить токен');
        }
    },

    async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            return token;
        } catch (error) {
            console.error('❌ Failed to get token:', error);
            return null;
        }
    },

    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            console.log('✅ Token removed successfully');
        } catch (error) {
            console.error('❌ Failed to remove token:', error);
        }
    },

    async hasToken(): Promise<boolean> {
        const token = await this.getToken();
        return !!token;
    }
};