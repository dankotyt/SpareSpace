import { createContext } from 'react';
import {TelegramProfile} from "@services/api/telegramApi";

export interface AuthContextType {
    // Существующие свойства
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

    // Существующие методы
    setPhone: (phone: string) => void;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    setFocus: (focused: boolean) => void;
    validatePhone: (phone: string) => boolean;
    validateEmail: (email: string) => boolean;
    validatePassword: (password: string) => boolean;
    switchScreen: (screen: 'phone' | 'email') => void;
    checkPhone: () => Promise<{ exists: boolean; message: string }>;
    login: () => Promise<any>;
    logout: () => Promise<void>;
    clearError: () => void;
    refreshAuthStatus: () => Promise<boolean>;

    // Telegram методы
    updateTelegramToken: (token: string, telegramId?: string) => Promise<boolean>;
    generateTelegramLink: () => Promise<string>;
    linkTelegramAccount: () => Promise<string>;
    unlinkTelegramAccount: () => Promise<void>;
    checkTelegramConnection: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);