import { API_BASE_URL } from '@/config/env';
import { tokenService } from '@services/tokenService';

/**
 * Интерфейс ответа для генерации ссылки Telegram
 */
export interface TelegramLinkResponse {
    link: string;
}

/**
 * Интерфейс ответа аутентификации через Telegram
 */
export interface TelegramAuthResponse {
    success: boolean;
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    telegramId?: string;
}

/**
 * Интерфейс профиля Telegram
 */
export interface TelegramProfile {
    id: string;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
}

/**
 * Сервис для работы с API Telegram интеграции
 * Предоставляет методы для OAuth аутентификации и управления привязкой Telegram
 */
class TelegramApiService {

    /**
     * Базовый метод для выполнения HTTP запросов к Telegram API
     * @param endpoint - конечная точка API
     * @param options - опции запроса fetch
     * @returns Промис с данными ответа
     * @throws Error при ошибке сети или невалидном ответе
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = await tokenService.getToken();

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error('Telegram API request failed:', error);
            throw error;
        }
    }

    /**
     * Генерирует ссылку для привязки Telegram аккаунта
     * @returns Промис с URL для авторизации в Telegram
     */
    async generateTelegramLink(): Promise<TelegramLinkResponse> {
        return this.request<TelegramLinkResponse>('/telegram/link', {
            method: 'GET',
        });
    }

    /**
     * Получает профиль Telegram текущего пользователя
     * @returns Промис с данными профиля Telegram или null
     */
    //todo таких эндпоинтов еще нет в бэкенде
    async getTelegramProfile(): Promise<TelegramProfile | null> {
        try {
            const response = await this.request<{ data: TelegramProfile }>('/telegram/profile', {
                method: 'GET',
            });
            return response.data || null;
        } catch (error) {
            console.log('Telegram profile not found (expected in local dev)');
            return null;
        }
    }

    /**
     * Отвязывает Telegram аккаунт от профиля пользователя
     * @param telegramId - ID Telegram аккаунта
     */
    async unlinkTelegramAccount(telegramId: string): Promise<void> {
        return this.request<void>('/telegram/unlink', {
            method: 'DELETE',
            body: JSON.stringify({ telegramId }),
        });
    }

    /**
     * Проверяет токен аутентификации Telegram
     * @param token - токен от Telegram OAuth
     * @returns Промис с результатом аутентификации
     */
    async checkTelegramAuth(token: string): Promise<TelegramAuthResponse> {
        return this.request<TelegramAuthResponse>('/telegram/auth', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }
}

export const telegramApiService = new TelegramApiService();