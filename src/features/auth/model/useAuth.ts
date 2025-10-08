import { useState, useCallback } from 'react';
import { AuthState, AuthActions } from './types';
import { isCompletePhoneNumber } from '@/shared/utils/phoneFormatter';

export const useAuth = (): AuthState & AuthActions => {
    const [phone, setPhone] = useState('+7');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused, setFocus] = useState(false);
    const [isValid, setValid] = useState(false);
    const [currentScreen, setCurrentScreen] = useState<'phone' | 'email'>('phone');

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

    return {
        phone,
        email,
        password,
        isFocused,
        isValid,
        currentScreen,
        setPhone: handleSetPhone,
        setEmail: handleSetEmail,
        setPassword: handleSetPassword,
        setFocus: handleSetFocus,
        validatePhone,
        validateEmail,
        switchScreen,
    };
};