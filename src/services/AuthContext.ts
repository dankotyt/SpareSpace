import { createContext } from 'react';
import { TelegramProfile } from "@services/api/telegramApi";
import { VerifySmsCodeResponse, LoginResponse } from '@/types/auth';

export interface AuthContextType {
    phone: string;
    email: string;
    password: string;
    isFocused: boolean;
    isValid: boolean;
    currentScreen: 'phone' | 'email';
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    isCheckingAuth: boolean;
    user: any;
    telegramLinked: boolean;
    telegramProfile: TelegramProfile | null;

    // Новые токены для флоу авторизации
    registerToken: string | null;
    twoFactorToken: string | null;

    setPhone: (phone: string) => void;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    setFocus: (focused: boolean) => void;
    setRegisterToken: (token: string | null) => void;
    setTwoFactorToken: (token: string | null) => void;

    validatePhone: (phone: string) => boolean;
    validateEmail: (email: string) => boolean;
    validatePassword: (password: string) => boolean;
    switchScreen: (screen: 'phone' | 'email') => void;
    
    // Новые методы
    requestSmsCode: () => Promise<void>;
    verifySmsCode: (code: string) => Promise<VerifySmsCodeResponse>;
    verifyTwoFactor: (code: string) => Promise<boolean>;
    login: () => Promise<LoginResponse>;
    
    logout: () => Promise<void>;
    clearError: () => void;
    refreshAuthStatus: () => Promise<boolean>;

    updateTelegramToken: (token: string, telegramId?: string) => Promise<boolean>;
    generateTelegramLink: () => Promise<string>;
    linkTelegramAccount: () => Promise<string>;
    unlinkTelegramAccount: () => Promise<void>;
    checkTelegramConnection: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
