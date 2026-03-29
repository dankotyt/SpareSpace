import { tokenService } from "@services/tokenService";
import { API_BASE_URL } from '@/config/env';
import { 
    CompleteRegistrationData, 
    LoginData, 
    AuthTokens, 
    LoginResponse, 
    VerifySmsCodeData, 
    VerifySmsCodeResponse,
    VerifyTwoFactorData
} from '@/types/auth';

console.log('🔗 Using API URL:', API_BASE_URL);

/**
 * Сервис для работы с API аутентификации
 */
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
            
            // Для HttpCode(HttpStatus.NO_CONTENT) или пустых ответов
            if (response.status === 204) {
                return {} as T;
            }

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
     * 1. Запрашивает SMS-код на указанный номер
     */
    async requestSmsCode(phone: string): Promise<void> {
        return this.request<void>('/auth/request-sms-code', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    }

    /**
     * 2. Подтверждает SMS-код
     */
    async verifySmsCode(data: VerifySmsCodeData): Promise<VerifySmsCodeResponse> {
        const response = await this.request<VerifySmsCodeResponse>('/auth/verify-sms-code', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Если пользователь уже зарегистрирован и нет 2FA, сохраняем токен
        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
        }

        return response;
    }

    /**
     * 3. Завершает регистрацию (используя registerToken)
     */
    async completeRegistration(data: CompleteRegistrationData): Promise<AuthTokens> {
        const { confirmPassword, ...apiData } = data; // confirmPassword бэкенду не нужен

        const response = await this.request<AuthTokens>('/auth/complete-registration', {
            method: 'POST',
            body: JSON.stringify(apiData),
        });

        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
        }

        return response;
    }

    /**
     * 4. Классический логин по паролю (Email или Телефон)
     */
    async login(credentials: LoginData): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
        }

        return response;
    }

    /**
     * 5. Подтверждение двухфакторной аутентификации (2FA)
     */
    async verifyTwoFactor(data: VerifyTwoFactorData): Promise<AuthTokens> {
        const response = await this.request<AuthTokens>('/auth/verify-2fa', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (response.accessToken) {
            await tokenService.saveToken(response.accessToken);
        }

        return response;
    }

    /**
     * 6. Выход из системы (инвалидация refresh-токена)
     * В реальном проекте здесь нужно передавать refreshToken, но мы пока просто удаляем токены из памяти
     */
    async logout(): Promise<void> {
        // Очищаем токен локально
        await tokenService.removeToken();
        // Можно добавить запрос к бэкенду, если токен хранится где-то еще:
        // await this.request<void>('/auth/logout', { method: 'POST', body: ...)
    }

    /**
     * Получает профиль текущего пользователя
     */
    async getProfile(): Promise<{ success: boolean; data?: any }> {
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
