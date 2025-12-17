export interface RegistrationData {
    firstName: string;
    lastName: string;
    patronymic?: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword?: string;
}