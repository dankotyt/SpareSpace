import {tokenService} from "@services/tokenService";
import { RegistrationData } from '@/types/auth';

const getApiBaseUrl = () => {
    if (__DEV__) {
        return 'http://192.168.0.198:3000';
    }
    return 'https://your-production-domain.com';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 Using API URL:', API_BASE_URL);

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
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

    async checkPhone(phoneData: { phone: string }): Promise<{ exists: boolean }> {
        return this.request<{ exists: boolean }>('/auth/check-phone-login', {
            method: 'POST',
            body: JSON.stringify(phoneData),
        });
    }

    async register(userData: RegistrationData): Promise<ApiResponse> {
        const { confirmPassword, first_name, last_name, patronymic, ...restData } = userData;

        const apiData = {
            ...restData,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            patronymic: patronymic?.trim() || undefined,
        };

        console.log('📤 Sending registration data to backend:', apiData);

        const response = await this.request<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(apiData),
        });

        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
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

    async login(credentials: { email: string; password: string }): Promise<ApiResponse> {
        console.log('📤 Sending login data to backend:', credentials);

        const response = await this.request<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
            console.log('✅ Login token saved');
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

    // async validateToken(): Promise<ApiResponse> {
    //     const token = await tokenService.getToken();
    //
    //     if (!token) {
    //         throw new Error('Токен не найден');
    //     }
    //
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`,
    //             },
    //         });
    //
    //         const responseData = await response.json();
    //
    //         if (!response.ok) {
    //             throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    //         }
    //
    //         return {
    //             success: true,
    //             data: responseData,
    //         };
    //     } catch (error) {
    //         if (error instanceof Error && (
    //             error.message.includes('401') ||
    //             error.message.includes('токен') ||
    //             error.message.includes('authorization')
    //         )) {
    //             await tokenService.removeToken();
    //         }
    //         throw error;
    //     }
    // }

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
}

export const authApiService = new AuthApiService();