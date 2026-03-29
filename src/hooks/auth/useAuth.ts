import {useCallback, useContext, useEffect, useState} from 'react';
import {isCompletePhoneNumber} from '@shared/utils/phoneFormatter';
import {AuthContext} from '@services/AuthContext';
import {authApiService} from '@services/api/authApi';
import {tokenService} from '@services/tokenService';
import {telegramApiService, TelegramProfile} from "@services/api/telegramApi";

/**
 * React-хук для получения контекста аутентификации
 * Должен использоваться только внутри AuthProvider
 * @returns Контекст аутентификации
 * @throws Error если используется вне AuthProvider
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Основной хук для логики аутентификации приложения
 * Управляет состоянием пользователя, токенами и интеграцией с Telegram
 */
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
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [telegramLinked, setTelegramLinked] = useState(false);
    const [telegramProfile, setTelegramProfile] = useState<TelegramProfile | null>(null);
    const [registerToken, setRegisterToken] = useState<string | null>(null);
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

    /**
     * Проверяет соединение с Telegram аккаунтом пользователя
     * @returns Промис без возвращаемого значения
     */
    const checkTelegramConnection = useCallback(async () => {
        try {
            if (user?.id) {
                const telegramData = await telegramApiService.getTelegramProfile();
                setTelegramLinked(!!telegramData);
                setTelegramProfile(telegramData);
            }
        } catch (error) {
            console.error('Error checking Telegram connection:', error);
            setTelegramLinked(false);
            setTelegramProfile(null);
        }
    }, [user?.id]);

    /**
     * Проверяет валидность токена и загружает профиль пользователя
     * @returns Промис с булевым значением валидности токена
     */
    const checkTokenValidity = useCallback(async (): Promise<boolean> => {
        try {
            const token = await tokenService.getToken();

            if (!token || token.trim() === '') {
                setUser(null);
                setTelegramLinked(false);
                setTelegramProfile(null);
                return false;
            }

            const profileResponse = await authApiService.getProfile();
            if (profileResponse.success && profileResponse.data) {
                setUser(profileResponse.data);
                await checkTelegramConnection();
                return true;
            } else {
                setUser(null);
                setTelegramLinked(false);
                setTelegramProfile(null);
                return false;
            }

        } catch (error) {
            await tokenService.removeToken();
            setUser(null);
            setTelegramLinked(false);
            setTelegramProfile(null);
            return false;
        }
    }, [checkTelegramConnection]);

    useEffect(() => {
        const initializeAuth = async () => {
            setIsCheckingAuth(true);
            try {
                const isValid = await checkTokenValidity();
                setIsAuthenticated(isValid);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        initializeAuth();
    }, [checkTokenValidity]);

    /**
     * Валидирует номер телефона по формату
     * @param phoneNumber - номер телефона для валидации
     * @returns Булево значение валидности телефона
     */
    const validatePhone = useCallback((phoneNumber: string): boolean => {
        return isCompletePhoneNumber(phoneNumber);
    }, []);

    /**
     * Валидирует email адрес по регулярному выражению
     * @param email - email для валидации
     * @returns Булево значение валидности email
     */
    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    /**
     * Валидирует пароль по минимальной длине
     * @param password - пароль для валидации
     * @returns Булево значение валидности пароля
     */
    const validatePassword = useCallback((password: string): boolean => {
        return password.length >= 8;
    }, []);

    /**
     * Устанавливает номер телефона с автоматической валидацией
     * @param newPhone - новый номер телефона
     */
    const handleSetPhone = useCallback((newPhone: string) => {
        setPhone(newPhone);
        setValid(validatePhone(newPhone));
        setError(null);
    }, [validatePhone]);

    /**
     * Устанавливает email с автоматической валидацией
     * @param newEmail - новый email
     */
    const handleSetEmail = useCallback((newEmail: string) => {
        setEmail(newEmail);
        const isEmailValid = validateEmail(newEmail);
        const isPasswordValid = validatePassword(password);
        setValid(isEmailValid && isPasswordValid);
        setError(null);
    }, [validateEmail, validatePassword, password]);

    /**
     * Устанавливает пароль с автоматической валидацией
     * @param newPassword - новый пароль
     */
    const handleSetPassword = useCallback((newPassword: string) => {
        setPassword(newPassword);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(newPassword);
        setValid(isEmailValid && isPasswordValid);
        setError(null);
    }, [validateEmail, validatePassword, email]);

    /**
     * Устанавливает фокус на поле ввода
     * @param focused - состояние фокуса
     */
    const handleSetFocus = useCallback((focused: boolean) => {
        setFocus(focused);
    }, []);

    /**
     * Переключает между экранами входа по телефону и email
     * @param screen - целевой экран ('phone' | 'email')
     */
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

    const requestSmsCode = useCallback(async () => {
        if (!validatePhone(phone)) throw new Error('Некорректный номер телефона');
        setIsLoading(true);
        setError(null);
        try {
            const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
            await authApiService.requestSmsCode(cleanedPhone);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка отправки SMS');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [phone, validatePhone]);

    const verifySmsCode = useCallback(async (code: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
            const response = await authApiService.verifySmsCode({ phone: cleanedPhone, code });

            if (response.requiresRegistration && response.registerToken) {
                setRegisterToken(response.registerToken);
            } else if (response.requiresTwoFactor && response.twoFactorToken) {
                setTwoFactorToken(response.twoFactorToken);
            } else if (response.accessToken) {
                setIsAuthenticated(true);
                const profileRes = await authApiService.getProfile();
                if (profileRes.success && profileRes.data) setUser(profileRes.data);
            }

            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неверный код');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [phone]);

    const verifyTwoFactor = useCallback(async (code: string) => {
        if (!twoFactorToken) throw new Error('Отсутствует токен 2FA');
        setIsLoading(true);
        setError(null);
        try {
            const response = await authApiService.verifyTwoFactor({ twoFactorToken, code });
            if (response.accessToken) {
                setIsAuthenticated(true);
                const profileRes = await authApiService.getProfile();
                if (profileRes.success && profileRes.data) setUser(profileRes.data);
                return true;
            }
            return false;
        } catch(err) {
            setError(err instanceof Error ? err.message : 'Неверный код 2FA');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [twoFactorToken]);

    /**
     * Выполняет вход пользователя по email и паролю
     * @returns Промис с результатом входа
     * @throws Error при некорректных данных или ошибке сети
     */
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
            
            if (response.requiresTwoFactor && response.twoFactorToken) {
                setTwoFactorToken(response.twoFactorToken);
                return response;
            }

            if (response.accessToken) {
                setIsAuthenticated(true);
                const profileResponse = await authApiService.getProfile();
                if (profileResponse.success && profileResponse.data) {
                    setUser(profileResponse.data);
                }
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

    /**
     * Выполняет выход пользователя, очищая токен и состояние
     */
    const logout = useCallback(async () => {
        try {
            // await tokenService.removeToken();
            await authApiService.logout();
        } catch (error) {
            // console.error('Error removing token:', error);
            console.error('Error logging out:', error);
        }

        setIsAuthenticated(false);
        setUser(null);
        setPhone('+7');
        setEmail('');
        setPassword('');
        setRegisterToken(null);
        setTwoFactorToken(null);
        setError(null);
    }, []);

    /**
     * Очищает текущую ошибку аутентификации
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Обновляет токен после успешной аутентификации через Telegram
     * @param token - JWT токен от сервера
     * @param telegramId - ID Telegram аккаунта (опционально)
     * @returns Промис с булевым результатом операции
     */
    const updateTelegramToken = useCallback(async (token: string, telegramId?: string) => {
        try {
            await tokenService.saveToken(token);

            const profileResponse = await authApiService.getProfile();
            if (profileResponse.success && profileResponse.data) {
                setUser(profileResponse.data);
                setIsAuthenticated(true);

                if (telegramId) {
                    setTelegramLinked(true);
                    await checkTelegramConnection();
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating Telegram token:', error);
            return false;
        }
    }, [checkTelegramConnection]);

    /**
     * Генерирует ссылку для привязки Telegram аккаунта
     * @returns Промис с URL ссылкой
     * @throws Error при ошибке генерации ссылки
     */
    const generateTelegramLink = useCallback(async (): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await telegramApiService.generateTelegramLink();
            return response.link;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка генерации ссылки';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Инициирует процесс привязки Telegram аккаунта
     * @returns Промис с URL ссылкой для Telegram
     */
    const linkTelegramAccount = useCallback(async (): Promise<string> => {
        try {
            return await generateTelegramLink();
        } catch (error) {
            throw error;
        }
    }, [generateTelegramLink]);

    /**
     * Отвязывает Telegram аккаунт от профиля пользователя
     * @returns Промис без возвращаемого значения
     * @throws Error если аккаунт не привязан или при ошибке сети
     */
    const unlinkTelegramAccount = useCallback(async () => {
        if (!telegramProfile?.id) {
            throw new Error('Telegram аккаунт не привязан');
        }

        setIsLoading(true);
        setError(null);

        try {
            await telegramApiService.unlinkTelegramAccount(telegramProfile.id);
            setTelegramLinked(false);
            setTelegramProfile(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка отвязки Telegram';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [telegramProfile?.id]);

    /**
     * Обновляет статус аутентификации, проверяя токен
     * @returns Промис с булевым статусом валидности
     */
    const refreshAuthStatus = useCallback(async (): Promise<boolean> => {
        try {
            const isValid = await checkTokenValidity();
            setIsAuthenticated(isValid);
            return isValid;
        } catch (error) {
            console.error('Error refreshing auth status:', error);
            setIsAuthenticated(false);
            return false;
        }
    }, [checkTokenValidity]);

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
        isCheckingAuth,
        user,
        telegramLinked,
        telegramProfile,
        registerToken,
        twoFactorToken,

        // Методы
        setPhone: handleSetPhone,
        setEmail: handleSetEmail,
        setPassword: handleSetPassword,
        setFocus: handleSetFocus,
        setRegisterToken,
        setTwoFactorToken,
        validatePhone,
        validateEmail,
        validatePassword,
        switchScreen,
        
        requestSmsCode,
        verifySmsCode,
        verifyTwoFactor,
        login,
        logout,
        clearError,
        refreshAuthStatus,

        // Telegram методы
        updateTelegramToken,
        generateTelegramLink,
        linkTelegramAccount,
        unlinkTelegramAccount,
        checkTelegramConnection,
    };
};