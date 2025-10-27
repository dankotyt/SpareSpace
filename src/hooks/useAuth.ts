import {useState, useCallback, useContext} from 'react';
import { isCompletePhoneNumber } from '@/shared/utils/phoneFormatter';
import { AuthContext } from '@/services/AuthContext';
import { authApiService } from '@/services/api/authApi';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const useAuthLogic = () => {
    const [phone, setPhone] = useState('+7');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused, setFocus] = useState(false);
    const [isValid, setValid] = useState(false);
    const [currentScreen, setCurrentScreen] = useState<'phone' | 'email'>('phone');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePhone = useCallback((phoneNumber: string): boolean => {
        return isCompletePhoneNumber(phoneNumber);
    }, []);

    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const validatePassword = useCallback((password: string): boolean => {
        return password.length >= 8;
    }, []);

    const handleSetPhone = useCallback((newPhone: string) => {
        setPhone(newPhone);
        setValid(validatePhone(newPhone));
        setError(null);
    }, [validatePhone]);

    const handleSetEmail = useCallback((newEmail: string) => {
        setEmail(newEmail);
        const isEmailValid = validateEmail(newEmail);
        const isPasswordValid = validatePassword(password);
        setValid(isEmailValid && isPasswordValid);
        setError(null);
    }, [validateEmail, validatePassword, password]);

    const handleSetPassword = useCallback((newPassword: string) => {
        setPassword(newPassword);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(newPassword);
        setValid(isEmailValid && isPasswordValid);
        setError(null);
    }, [validateEmail, validatePassword, email]);

    const handleSetFocus = useCallback((focused: boolean) => {
        setFocus(focused);
    }, []);

    const switchScreen = useCallback((screen: 'phone' | 'email') => {
        setCurrentScreen(screen);
        setFocus(false);
        setError(null);

        if (screen === 'phone') {
            setValid(validatePhone(phone));
        } else {
            const isEmailValid = validateEmail(email);
            const isPasswordValid = validatePassword(password);
            setValid(isEmailValid && isPasswordValid);
        }
    }, [phone, email, password, validatePhone, validateEmail, validatePassword]);

    const checkPhone = useCallback(async (): Promise<{ exists: boolean; message: string }> => {
        if (!validatePhone(phone)) {
            throw new Error('Некорректный номер телефона');
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await authApiService.checkPhone({ phone });

            if (response.exists) {
                return {
                    exists: true,
                    message: 'Номер найден в системе. На ваш номер отправлено SMS.'
                };
            } else {
                return {
                    exists: false,
                    message: 'Этот номер не зарегистрирован. Хотите зарегистрироваться?'
                };
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка проверки номера';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [phone, validatePhone]);

    const login = useCallback(async () => {
        if (!email || !password) {
            throw new Error('Заполните email и пароль');
        }

        if (!validateEmail(email)) {
            throw new Error('Некорректный email');
        }

        if (!validatePassword(password)) {
            throw new Error('Пароль должен содержать минимум 8 символов');
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await authApiService.login({ email, password });

            if (response.accessToken) {
                setIsAuthenticated(true);
            }

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка входа';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [email, password, validateEmail, validatePassword]);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
        setPhone('+7');
        setEmail('');
        setPassword('');
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        phone,
        email,
        password,
        isFocused,
        isValid,
        currentScreen,
        isAuthenticated,
        isLoading,
        error,

        setPhone: handleSetPhone,
        setEmail: handleSetEmail,
        setPassword: handleSetPassword,
        setFocus: handleSetFocus,
        validatePhone,
        validateEmail,
        validatePassword,
        switchScreen,
        checkPhone,
        login,
        logout,
        clearError,
    };
};