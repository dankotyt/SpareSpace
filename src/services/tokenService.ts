import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

/**
 * Сервис управления JWT токенами аутентификации
 * Инкапсулирует работу с AsyncStorage для безопасного хранения токенов
 */
export const tokenService = {

    /**
     * Сохраняет токен аутентификации в безопасном хранилище
     * @param token - JWT токен для сохранения
     * @throws Error при ошибке записи в хранилище
     */
    async saveToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            console.log('✅ Token saved successfully');
        } catch (error) {
            console.error('❌ Failed to save token:', error);
            throw new Error('Не удалось сохранить токен');
        }
    },

    /**
     * Получает сохраненный токен аутентификации
     * @returns Промис с токеном или null если токен не найден
     */
    async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            return token;
        } catch (error) {
            console.error('❌ Failed to get token:', error);
            return null;
        }
    },

    /**
     * Удаляет токен аутентификации из хранилища
     */
    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            console.log('✅ Token removed successfully');
        } catch (error) {
            console.error('❌ Failed to remove token:', error);
        }
    },

    /**
     * Проверяет наличие токена в хранилище
     * @returns Промис с булевым значением наличия токена
     */
    async hasToken(): Promise<boolean> {
        const token = await this.getToken();
        return !!token;
    }
};