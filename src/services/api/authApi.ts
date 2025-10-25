import { RegistrationData } from '@/hooks/useRegistration';

// Базовый URL API
const API_BASE_URL = 'https://your-api-domain.com/api'; // Заменить на реальный URL

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    token?: string;
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
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async register(userData: RegistrationData): Promise<ApiResponse> {
        // Подготовка данных для отправки (убираем confirmPassword)
        const { confirmPassword, ...registrationData } = userData;

        return this.request<ApiResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registrationData),
        });
    }

    // Другие методы API...
    async login(credentials: { email: string; password: string }): Promise<ApiResponse> {
        return this.request<ApiResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }
}

export const authApiService = new AuthApiService();