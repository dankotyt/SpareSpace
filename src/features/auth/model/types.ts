export interface AuthState {
    phone: string;
    email: string;
    password: string;
    isFocused: boolean;
    isValid: boolean;
    currentScreen: 'phone' | 'email';
}

export interface AuthActions {
    setPhone: (phone: string) => void;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    setFocus: (isFocused: boolean) => void;
    validatePhone: (phone: string) => boolean;
    validateEmail: (email: string) => boolean;
    switchScreen: (screen: 'phone' | 'email') => void;
}