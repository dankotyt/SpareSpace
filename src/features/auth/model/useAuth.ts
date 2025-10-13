import {useState, useCallback, useContext} from 'react';
import { isCompletePhoneNumber } from '@/shared/utils/phoneFormatter';
import { AuthContext } from './AuthContext';

const useAuthLogic = () => {
    const [phone, setPhone] = useState('+7');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused, setFocus] = useState(false);
    const [isValid, setValid] = useState(false);
    const [currentScreen, setCurrentScreen] = useState<'phone' | 'email'>('phone');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    }, [validatePhone]);

    const handleSetEmail = useCallback((newEmail: string) => {
        setEmail(newEmail);
        const isEmailValid = validateEmail(newEmail);
        const isPasswordValid = validatePassword(password);
        setValid(isEmailValid && isPasswordValid);
    }, [validateEmail, validatePassword, password]);

    const handleSetPassword = useCallback((newPassword: string) => {
        setPassword(newPassword);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(newPassword);
        setValid(isEmailValid && isPasswordValid);
    }, [validateEmail, validatePassword, email]);

    const handleSetFocus = useCallback((focused: boolean) => {
        setFocus(focused);
    }, []);

    const switchScreen = useCallback((screen: 'phone' | 'email') => {
        setCurrentScreen(screen);
        setFocus(false);

        if (screen === 'phone') {
            setValid(validatePhone(phone));
        } else {
            setValid(validateEmail(email));
        }
    }, [phone, email, validatePhone, validateEmail]);

    const login = useCallback(() => {
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
    }, []);

    return {
        phone,
        email,
        password,
        isFocused,
        isValid,
        currentScreen,
        isAuthenticated,
        setPhone: handleSetPhone,
        setEmail: handleSetEmail,
        setPassword: handleSetPassword,
        setFocus: handleSetFocus,
        validatePhone,
        validateEmail,
        switchScreen,
        login,
        logout,
    };
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { useAuthLogic };