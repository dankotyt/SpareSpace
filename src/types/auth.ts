export interface RegistrationData {
    firstName: string;
    lastName: string;
    patronymic?: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword?: string;
    deviceId?: string;
    fcmToken?: string;
    platform?: 'ios' | 'android';
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface DeviceInfo {
    deviceId: string;
    fcmToken: string | null;
    platform: 'ios' | 'android';
}