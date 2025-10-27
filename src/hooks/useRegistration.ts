import { useState, useCallback } from 'react';
import { authApiService, ApiResponse } from '@/services/api/authApi';
import { isCompletePhoneNumber } from '@/shared/utils/phoneFormatter';

export interface RegistrationData {
    first_name: string;
    last_name: string;
    patronymic?: string;
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

export const useRegistration = (): UseRegistrationReturn => {
    const [registrationData, setRegistrationData] = useState<RegistrationData>({
        first_name: '',
        last_name: '',
        patronymic: '',
        phone: '+7',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [isFocused, setIsFocused] = useState(false);
    const [currentField, setCurrentField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFirstName = useCallback((firstName: string): boolean => {
        return firstName.trim().length > 0;
    }, []);

    const validateLastName = useCallback((lastName: string): boolean => {
        return lastName.trim().length > 0;
    }, []);

    const validatePhone = useCallback((phone: string): boolean => {
        return isCompletePhoneNumber(phone);
    }, []);

    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const validatePassword = useCallback((password: string): boolean => {
        return password.length >= 8;
    }, []);

    const validateConfirmPassword = useCallback((confirmPassword: string, password: string): boolean => {
        return confirmPassword === password && confirmPassword.length > 0;
    }, []);

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

    const isValid = useCallback((): boolean => {
        const { first_name, last_name, phone, email, password, confirmPassword } = registrationData;

        return (
            validateFirstName(first_name) &&
            validateLastName(last_name) &&
            validatePhone(phone) &&
            validateEmail(email) &&
            validatePassword(password) &&
            validateConfirmPassword(confirmPassword, password)
        );
    }, [registrationData, validateFirstName, validateLastName, validatePhone, validateEmail, validatePassword, validateConfirmPassword]);

    const register = useCallback(async (): Promise<ApiResponse> => {
        if (!isValid()) {
            const { first_name, last_name, phone, email, password, confirmPassword } = registrationData;

            if (!validateFirstName(first_name)) {
                throw new Error('Введите имя');
            }
            if (!validateLastName(last_name)) {
                throw new Error('Введите фамилию');
            }
            if (!validatePhone(phone)) {
                throw new Error('Введите корректный номер телефона');
            }
            if (!validateEmail(email)) {
                throw new Error('Введите корректный email');
            }
            if (!validatePassword(password)) {
                throw new Error('Пароль должен содержать минимум 8 символов');
            }
            if (!validateConfirmPassword(confirmPassword, password)) {
                throw new Error('Пароли не совпадают');
            }

            throw new Error('Не все поля заполнены корректно');
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await authApiService.register(registrationData);

            if (!response.success) {
                throw new Error(response.message || 'Ошибка регистрации');
            }

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [registrationData, isValid, validateFirstName, validateLastName, validatePhone, validateEmail, validatePassword, validateConfirmPassword]);

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