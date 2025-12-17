import { API_BASE_URL } from '@/config/env';
import { tokenService } from '@services/tokenService';

export interface TelegramLinkResponse {
    link: string;
}

export interface TelegramAuthResponse {
    success: boolean;
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    telegramId?: string;
}

export interface TelegramProfile {
    id: string;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
}

class TelegramApiService {
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

    async generateTelegramLink(): Promise<TelegramLinkResponse> {
        return this.request<TelegramLinkResponse>('/telegram/link', {
            method: 'GET',
        });
    }

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

    async unlinkTelegramAccount(telegramId: string): Promise<void> {
        return this.request<void>('/telegram/unlink', {
            method: 'DELETE',
            body: JSON.stringify({ telegramId }),
        });
    }

    async checkTelegramAuth(token: string): Promise<TelegramAuthResponse> {
        return this.request<TelegramAuthResponse>('/telegram/auth', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }
}

export const telegramApiService = new TelegramApiService();