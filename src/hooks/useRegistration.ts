import { useState, useCallback } from 'react';
import { authApiService } from '@/services/api/authApi';
import { ApiResponse } from '@/services/api/authApi';

export interface RegistrationData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface UseRegistrationReturn {
    registrationData: RegistrationData;
    isFocused: boolean;
    currentField: string | null;
    isLoading: boolean;
    error: string | null;
    updateField: (field: keyof RegistrationData, value: string) => void;
    setFocus: (focused: boolean, field?: string) => void;
    isValid: boolean;
    register: () => Promise<ApiResponse>;
    clearError: () => void;
}

export const useRegistration = () => {
    const [registrationData, setRegistrationData] = useState<RegistrationData>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [isFocused, setIsFocused] = useState(false);
    const [currentField, setCurrentField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = useCallback((field: keyof RegistrationData, value: string) => {
        setRegistrationData(prev => ({
            ...prev,
            [field]: value,
        }));
        if (error) {
            setError(null);
        }
    }, [error]);

    const setFocus = useCallback((focused: boolean, field?: string) => {
        setIsFocused(focused);
        setCurrentField(field || null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Валидация формы
    const isValid = useCallback((): boolean => {
        const { firstName, lastName, phone, email, password, confirmPassword } = registrationData;

        return (
            firstName.trim().length > 0 &&
            lastName.trim().length > 0 &&
            phone.trim().length >= 10 &&
            email.includes('@') &&
            email.includes('.') &&
            password.length >= 6 &&
            password === confirmPassword
        );
    }, [registrationData]);

    const register = useCallback(async () => {
        if (!isValid()) {
            const errorMessage = 'Не все поля заполнены корректно';
            setError(errorMessage);
            throw new Error(errorMessage);
        }

        setIsLoading(true);
        setError(null);
        // Здесь будет вызов API для регистрации
        console.log('Registration data:', registrationData);

        try {
            const response = await authApiService.register(registrationData);

            console.log('Registration successful:', response);

            // Сохраняем токен если он есть в ответе
            if (response.token) {
                // Здесь можно сохранить токен в AsyncStorage или Context
                // await AsyncStorage.setItem('authToken', response.token);
            }

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [registrationData, isValid]);

    return {
        registrationData,
        isFocused,
        currentField,
        isLoading,
        error,
        updateField,
        setFocus,
        isValid: isValid(),
        register,
        clearError,
    };
};