import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';
import { getInputColors } from '@/shared/utils/inputColors';


interface PasswordInputProps {
    value: string;
    isFocused: boolean;
    error?: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

/**
 * React-компонент для ввода пароля с переключением видимости
 * Обеспечивает безопасный ввод чувствительных данных
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
                                                                value,
                                                                isFocused,
                                                                error,
                                                                onChangeText,
                                                                onFocus,
                                                                onBlur,
                                                            }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused, error);

    /**
     * Переключает видимость текста пароля
     */
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    /**
     * Определяет цвет иконки глаза в зависимости от состояния
     * @returns HEX цвет для иконки
     */
    const getEyeIconColor = () => {
        if (error) return COLORS.red[500];
        return isPasswordVisible ? COLORS.primary : COLORS.borderEmpty;
    };

    /**
     * Определяет имя иконки глаза в зависимости от видимости пароля
     * @returns Имя иконки из Ionicons
     */
    const getEyeIconName = () => {
        return isPasswordVisible ? 'eye-off-outline' : 'eye-outline';
    };

    return (
        <TouchableWithoutFeedback onPress={onFocus}>
            <View style={styles.container}>
                <Text style={[
                    styles.label,
                    { color: labelColor }
                ]}>
                    Пароль
                </Text>
                <View style={[
                    styles.inputContainer,
                    { borderColor }
                ]}>
                    <TextInput
                        style={[
                            styles.input,
                            { color: textColor }
                        ]}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor={COLORS.primary}
                        maxLength={50}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={togglePasswordVisibility}
                    >
                        <Ionicons
                            name={getEyeIconName()}
                            size={24}
                            color={getEyeIconColor()}
                        />
                    </TouchableOpacity>
                </View>
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        borderWidth: 2,
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingVertical: 4,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        fontSize: 18,
        paddingVertical: 12,
        fontWeight: '500',
        padding: 0,
        flex: 1,
    },
    eyeIcon: {
        padding: 4,
        marginLeft: 8,
    },
    errorText: {
        color: COLORS.red[50],
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});