import {tokenService} from "@services/tokenService";
import { RegistrationData } from '@/types/auth';
import { API_BASE_URL } from '@/config/env';

console.log('🔗 Using API URL:', API_BASE_URL);

/**
 * Интерфейс стандартного ответа API
 */
export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
}

/**
 * Сервис для работы с API аутентификации
 * Инкапсулирует логику запросов связанных с авторизацией и регистрацией
 */
class AuthApiService {

    /**
     * Базовый метод для выполнения HTTP запросов к API
     * @param endpoint - конечная точка API
     * @param options - опции запроса fetch
     * @returns Промис с данными ответа
     * @throws Error при ошибке сети или невалидном ответе
     */
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
     * Проверяет существование телефона в системе
     * @param phoneData - объект с номером телефона
     * @returns Промис с информацией о существовании телефона
     */
    async checkPhone(phoneData: { phone: string }): Promise<{ exists: boolean }> {
        return this.request<{ exists: boolean }>('/auth/check-phone-login', {
            method: 'POST',
            body: JSON.stringify(phoneData),
        });
    }

    /**
     * Регистрирует нового пользователя в системе
     * @param userData - данные пользователя для регистрации
     * @returns Промис с результатом регистрации
     */
    async register(userData: RegistrationData): Promise<ApiResponse> {
        const { confirmPassword, firstName, lastName, patronymic, ...restData } = userData;

        const apiData = {
            ...restData,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
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

    /**
     * Выполняет вход пользователя по email и паролю
     * @param credentials - объект с email и паролем
     * @returns Промис с результатом входа
     */
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

    /**
     * Получает профиль текущего аутентифицированного пользователя
     * @returns Промис с данными профиля
     * @throws Error при отсутствии токена или ошибке сервера
     */
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