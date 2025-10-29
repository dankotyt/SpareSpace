import { useState, useCallback } from 'react';
import { authApiService } from '@/services/api/authApi';

export const useRegistration = () => {
    const [registrationData, setRegistrationData] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [isFocused, setIsFocused] = useState(false);
    const [currentField, setCurrentField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = useCallback((field: string, value: string) => {
        setRegistrationData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    const setFocus = useCallback((focused: boolean, field?: string) => {
        setIsFocused(focused);
        setCurrentField(focused ? field || null : null);
    }, []);

    const clearError = useCallback((field?: string) => {
        if (field) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        } else {
            setErrors({});
        }
    }, []);

    const validateField = useCallback((field: string, value: string): string => {
        switch (field) {
            case 'first_name':
                if (!value.trim()) return 'Имя обязательно для заполнения';
                if (value.length > 50) return 'Имя не должно превышать 50 символов';
                return '';

            case 'last_name':
                if (!value.trim()) return 'Фамилия обязательна для заполнения';
                if (value.length > 50) return 'Фамилия не должна превышать 50 символов';
                return '';

            case 'patronymic':
                if (value.length > 50) return 'Отчество не должно превышать 50 символов';
                return '';

            case 'email':
                if (!value.trim()) return 'Email обязателен для заполнения';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email';
                return '';

            case 'phone':
                if (!value.trim()) return 'Телефон обязателен для заполнения';
                if (value.replace(/\D/g, '').length < 11) return 'Введите корректный номер телефона';
                return '';

            case 'password':
                if (!value.trim()) return 'Пароль обязателен для заполнения';
                if (value.length < 6) return 'Пароль должен содержать минимум 6 символов';
                return '';

            case 'confirmPassword':
                if (value !== registrationData.password) return 'Пароли не совпадают';
                return '';

            default:
                return '';
        }
    }, [registrationData.password]);

    const isValid = useCallback(() => {
        const requiredFields = ['first_name', 'last_name', 'phone', 'email', 'password', 'confirmPassword'];

        for (const field of requiredFields) {
            const error = validateField(field, registrationData[field as keyof typeof registrationData]);
            if (error) return false;
        }

        return registrationData.password === registrationData.confirmPassword;
    }, [registrationData, validateField]);

    const register = useCallback(async () => {
        setErrors({});

        const newErrors: Record<string, string> = {};
        Object.keys(registrationData).forEach(field => {
            const error = validateField(field, registrationData[field as keyof typeof registrationData]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return { success: false, message: 'Пожалуйста, исправьте ошибки в форме' };
        }

        setIsLoading(true);

        try {
            const result = await authApiService.register({
                first_name: registrationData.first_name,
                last_name: registrationData.last_name,
                patronymic: registrationData.patronymic || undefined,
                phone: registrationData.phone,
                email: registrationData.email,
                password: registrationData.password,
            });

            if (result.success) {
                return { success: true, message: 'Регистрация успешна' };
            } else {
                let fieldErrors: Record<string, string> = {};

                if (result.message?.includes('Email already exists')) {
                    fieldErrors.email = 'Этот email уже используется';
                } else if (result.message?.includes('Phone already exists')) {
                    fieldErrors.phone = 'Этот номер телефона уже используется';
                } else if (result.message?.includes('email')) {
                    fieldErrors.email = result.message;
                } else if (result.message?.includes('phone')) {
                    fieldErrors.phone = result.message;
                } else if (result.message?.includes('first_name') || result.message?.includes('name')) {
                    fieldErrors.first_name = result.message;
                } else if (result.message?.includes('last_name')) {
                    fieldErrors.last_name = result.message;
                }

                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(fieldErrors);
                }

                return {
                    success: false,
                    message: result.message || 'Ошибка регистрации'
                };
            }
        } catch (error: any) {
            console.log('Registration error:', error);

            let errorMessage = 'Произошла неизвестная ошибка';
            let fieldErrors: Record<string, string> = {};

            if (error.message?.includes('Email already exists')) {
                fieldErrors.email = 'Этот email уже используется';
                errorMessage = 'Этот email уже используется';
            } else if (error.message?.includes('Phone already exists')) {
                fieldErrors.phone = 'Этот номер телефона уже используется';
                errorMessage = 'Этот номер телефона уже используется';
            } else {
                errorMessage = error.message || 'Ошибка сети';
            }

            if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors);
            }

            return { success: false, message: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [registrationData, validateField]);

    return {
        registrationData,
        isFocused,
        currentField,
        errors,
        updateField,
        setFocus,
        isValid: isValid(),
        isLoading,
        register,
        clearError,
    };
};