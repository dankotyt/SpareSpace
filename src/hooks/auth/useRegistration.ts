import { useState, useCallback } from 'react';
import { authApiService } from '@services/api/authApi';
import { useAuth } from '@hooks/auth/useAuth'; // Подключаем чтобы достать registerToken

/**
 * Хук для управления логикой регистрации пользователя
 * Обрабатывает валидацию формы и отправку данных на сервер
 */
export const useRegistration = () => {
    // 1. Достаем registerToken из контекста авторизации
    const { registerToken } = useAuth();

    // 2. Убираем phone и email из стейта регистрации
    const [registrationData, setRegistrationData] = useState({
        firstName: '',
        lastName: '',
        patronymic: '',
        password: '',
        confirmPassword: '',
    });

    const [isFocused, setIsFocused] = useState(false);
    const [currentField, setCurrentField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    /**
     * Обновляет значение поля формы регистрации
     * @param field - имя поля для обновления
     * @param value - новое значение поля
     */
    const updateField = useCallback((field: string, value: string) => {
        setRegistrationData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    /**
     * Управляет состоянием фокуса для полей формы
     * @param focused - состояние фокуса (true/false)
     * @param field - имя поля (опционально)
     */
    const setFocus = useCallback((focused: boolean, field?: string) => {
        setIsFocused(focused);
        setCurrentField(focused ? field || null : null);
    }, []);

    /**
     * Очищает ошибку для конкретного поля или все ошибки
     * @param field - имя поля для очистки (опционально)
     */
    const clearError = useCallback((field?: string) => {
        if (field) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        } else {
            setErrors({});
        }
    }, []);

    // 3. Убираем валидацию phone и email
    /**
     * Валидирует значение конкретного поля формы
     * @param field - имя поля для валидации
     * @param value - значение для проверки
     * @returns Строку с ошибкой или пустую строку при успехе
     */
    const validateField = useCallback((field: string, value: string): string => {
        switch (field) {
            case 'firstName':
                if (!value.trim()) return 'Имя обязательно для заполнения';
                if (value.length > 50) return 'Имя не должно превышать 50 символов';
                return '';

            case 'lastName':
                if (!value.trim()) return 'Фамилия обязательна для заполнения';
                if (value.length > 50) return 'Фамилия не должна превышать 50 символов';
                return '';

            case 'patronymic':
                if (value && value.length > 50) return 'Отчество не должно превышать 50 символов';
                return '';

            case 'password':
                if (!value.trim()) return 'Пароль обязателен для заполнения';
                if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
                return '';

            case 'confirmPassword':
                if (value !== registrationData.password) return 'Пароли не совпадают';
                return '';

            default:
                return '';
        }
    }, [registrationData.password]);

    // 4. Удаляем phone и email из списка обязательных полей 
    /**
     * Проверяет валидность всей формы регистрации
     * @returns Булево значение валидности формы
     */
    const isValid = useCallback(() => {
        const requiredFields = ['firstName', 'lastName', 'password', 'confirmPassword'];

        for (const field of requiredFields) {
            const error = validateField(field, registrationData[field as keyof typeof registrationData]);
            if (error) return false;
        }

        return registrationData.password === registrationData.confirmPassword;
    }, [registrationData, validateField]);

    // 5. Отправляем данные с использованием registerToken
    /**
     * Отправляет данные регистрации на сервер
     * @returns Промис с результатом регистрации
     * @throws Error при ошибках валидации или сети
     */
    const register = useCallback(async () => {
        setErrors({});

        if (!registerToken) {
            return { success: false, message: 'Отсутствует токен регистрации. Пожалуйста, подтвердите телефон заново.' };
        }

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
            // Передаем registerToken и обновленные данные
            const result = await authApiService.completeRegistration({
                registerToken: registerToken,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                patronymic: registrationData.patronymic || undefined,
                password: registrationData.password,
            });

            // Если вернулся accessToken, значит регистрация успешна
            if (result.accessToken) {
                return { success: true, message: 'Регистрация успешна' };
            } else {
                return { success: false, message: 'Ошибка регистрации: токен не получен' };
            }

        } catch (error: any) {
            console.log('Registration error:', error);
            
            // Пытаемся вытащить сообщение об ошибке с бэкенда
            let errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка';
            
            return { success: false, message: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [registrationData, validateField, registerToken]);

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
