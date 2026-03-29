// Данные для отправки SMS
export interface RequestSmsCodeData {
    phone: string;
}

// Данные для проверки SMS
export interface VerifySmsCodeData {
    phone: string;
    code: string;
}

// Данные для завершения регистрации
export interface CompleteRegistrationData {
    registerToken: string;
    firstName: string;
    lastName: string;
    patronymic?: string;
    password: string;
    confirmPassword?: string;
}

// Данные для входа по паролю
export interface LoginData {
    phone?: string;
    email?: string;
    password: string;
}

// Данные для проверки 2FA
export interface VerifyTwoFactorData {
    twoFactorToken: string;
    code: string;
}

// --- ОТВЕТЫ СЕРВЕРА (RESPONSES) ---

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    accessToken?: string;
    refreshToken?: string;
    requiresTwoFactor?: boolean;
    twoFactorToken?: string;
}

export interface VerifySmsCodeResponse {
    requiresRegistration?: boolean;
    registerToken?: string;
    requiresTwoFactor?: boolean;
    twoFactorToken?: string;
    accessToken?: string;
    refreshToken?: string;
}
