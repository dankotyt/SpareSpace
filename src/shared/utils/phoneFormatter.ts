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

export const cleanPhoneNumber = (formattedPhone: string): string => {
    return '+7' + formattedPhone.slice(2).replace(/\D/g, '');
};

export const isCompletePhoneNumber = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 12;
};