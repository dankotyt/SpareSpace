import { COLORS } from '@/shared/constants/colors';

export const getInputColors = (value: string, isFocused: boolean) => {
    const hasText = value.length > 2;

    const getBorderColor = () => {
        if (isFocused) {
            return COLORS.borderActive;
        }
        if (hasText) {
            return COLORS.borderEmpty;
        }
        return COLORS.borderEmpty;
    };

    const getTextColor = () => {
        if (isFocused || hasText) {
            return COLORS.text;
        }
        return COLORS.textDisabled;
    };

    const getLabelColor = () => {
        if (isFocused || hasText) {
            return COLORS.text;
        }
        return COLORS.textDisabled;
    };

    return {
        borderColor: getBorderColor(),
        textColor: getTextColor(),
        labelColor: getLabelColor(),
        hasText,
    };
};