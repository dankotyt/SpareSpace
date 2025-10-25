import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'alternative' | 'outline';
    loading?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
                                                          title,
                                                          onPress,
                                                          disabled = false,
                                                          variant = 'primary',
                                                          loading = false,
                                                      }) => {
    const getButtonStyle = () => {
        if (disabled || loading) {
            return [styles.button, styles.disabled];
        }

        if (variant === 'secondary') {
            return [styles.button, styles.secondary];
        }

        if (variant === 'alternative') {
            return [styles.button, styles.alternative];
        }

        if (variant === 'outline') {
            return [styles.button, styles.outline];
        }

        return [styles.button, styles.primary];
    };

    const getTextStyle = () => {
        if (disabled || loading) {
            return [styles.text, styles.textDisabled];
        }

        if (variant === 'secondary') {
            return [styles.text, styles.textSecondary];
        }

        if (variant === 'alternative') {
            return [styles.text, styles.textAlternative];
        }

        if (variant === 'outline') {
            return [styles.text, styles.textOutline];
        }

        return [styles.text, styles.textPrimary];
    };

    const getActivityIndicatorColor = () => {
        if (variant === 'outline' || variant === 'secondary') {
            return COLORS.primary;
        }
        return COLORS.white;
    };

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator
                    color={getActivityIndicatorColor()}
                    size="small"
                />
            ) : (
                <Text style={getTextStyle()}>{title || ''}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: 'transparent',
    },
    alternative: {
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    disabled: {
        backgroundColor: COLORS.textDisabled,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    textPrimary: {
        color: COLORS.textLight,
    },
    textSecondary: {
        color: COLORS.primary,
    },
    textAlternative: {
        color: COLORS.textLight,
    },
    textOutline: {
        color: COLORS.primary,
    },
    textDisabled: {
        color: COLORS.white,
    },
});