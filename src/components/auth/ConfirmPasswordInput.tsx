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

/**
 * Пропсы для поля подтверждения пароля
 */
interface ConfirmPasswordInputProps {
    value: string;
    password: string;
    isFocused: boolean;
    error?: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

/**
 * Компонент для повторного ввода пароля с валидацией совпадения
 * Отображает иконку видимости пароля и статус валидации
 */
export const ConfirmPasswordInput: React.FC<ConfirmPasswordInputProps> = ({
                                                                              value,
                                                                              password,
                                                                              isFocused,
                                                                              error,
                                                                              onChangeText,
                                                                              onFocus,
                                                                              onBlur,
                                                                          }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [hasBeenTouched, setHasBeenTouched] = useState(false);

    const displayError = error || (hasBeenTouched && value !== '' && value !== password ? 'Пароли не совпадают' : undefined);
    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused, displayError);

    const isValid = value !== '' && value === password && !error;

    /**
     * Переключает видимость текста пароля
     */
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    /**
     * Обрабатывает изменение текста с отметкой о касании
     * @param text - введенный текст
     */
    const handleChangeText = (text: string) => {
        if (!hasBeenTouched) {
            setHasBeenTouched(true);
        }
        onChangeText(text);
    };

    /**
     * Обрабатывает потерю фокуса с установкой флага касания
     */
    const handleBlur = () => {
        setHasBeenTouched(true);
        onBlur();
    };

    /**
     * Определяет цвет иконки глаза в зависимости от состояния
     * @returns HEX цвет для иконки
     */
    const getEyeIconColor = () => {
        if (displayError) return COLORS.red[500];
        if (isValid) return COLORS.green[500];
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
                    Повторите пароль
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
                        onChangeText={handleChangeText}
                        onFocus={onFocus}
                        onBlur={handleBlur}
                        placeholderTextColor={COLORS.gray[400]}
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
                {displayError ? (
                    <Text style={styles.errorText}>{displayError}</Text>
                ) : isValid ? (
                    <Text style={styles.successText}>Пароли совпадают</Text>
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
    successText: {
        color: COLORS.green[500],
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});