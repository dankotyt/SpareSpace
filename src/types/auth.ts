export interface AuthState {
    phone: string;
    email: string;
    password: string;
    isFocused: boolean;
    isValid: boolean;
    currentScreen: 'phone' | 'email';
    isAuthenticated : boolean;
}

export interface AuthActions {
    setPhone: (phone: string) => void;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    setFocus: (isFocused: boolean) => void;
    validatePhone: (phone: string) => boolean;
    validateEmail: (email: string) => boolean;
    switchScreen: (screen: 'phone' | 'email') => void;
    login: () => void;
    logout: () => void;
}

export interface RegistrationData {
    first_name: string;
    last_name: string;
    patronymic?: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword?: string;
}