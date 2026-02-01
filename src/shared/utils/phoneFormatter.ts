/**
 * Форматирует номер телефона в российский формат: +7 XXX XXX-XX-XX
 * @param input - сырой ввод номера телефона
 * @returns Отформатированную строку с телефонным номером
 */
export const formatPhoneNumber = (input: string): string => {

    const digits = input.slice(2).replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 10);

    let formatted = '+7';

    if (limitedDigits.length > 0) {
        formatted += ' ' + limitedDigits.slice(0, 3);
    }

    if (limitedDigits.length > 3) {
        formatted += ' ' + limitedDigits.slice(3, 6);
    }

    if (limitedDigits.length > 6) {
        formatted += '-' + limitedDigits.slice(6, 8);
    }

    if (limitedDigits.length > 8) {
        formatted += '-' + limitedDigits.slice(8, 10);
    }

    return formatted;
};

/**
 * Очищает отформатированный номер телефона, оставляя только цифры с кодом страны
 * @param formattedPhone - отформатированный номер телефона
 * @returns Очищенную строку с телефонным номером в формате +7XXXXXXXXXX
 */
export const cleanPhoneNumber = (formattedPhone: string): string => {
    return '+7' + formattedPhone.slice(2).replace(/\D/g, '');
};

/**
 * Проверяет, является ли номер телефона полным (11 цифр с кодом страны)
 * @param phone - номер телефона для проверки
 * @returns Булево значение полноты номера
 */
export const isCompletePhoneNumber = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 12;
};