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

interface ConfirmPasswordInputProps {
    value: string;
    password: string;
    isFocused: boolean;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

export const ConfirmPasswordInput: React.FC<ConfirmPasswordInputProps> = ({
                                                                              value,
                                                                              password,
                                                                              isFocused,
                                                                              onChangeText,
                                                                              onFocus,
                                                                              onBlur,
                                                                          }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [hasBeenTouched, setHasBeenTouched] = useState(false);

    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused);
    const isError = hasBeenTouched && value !== '' && value !== password;
    const isValid = value !== '' && value === password;

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleChangeText = (text: string) => {
        if (!hasBeenTouched) {
            setHasBeenTouched(true);
        }
        onChangeText(text);
    };

    const handleBlur = () => {
        setHasBeenTouched(true);
        onBlur();
    };

    const getEyeIconColor = () => {
        if (isError) return COLORS.red[500];
        if (isValid) return COLORS.green[500];
        return isPasswordVisible ? COLORS.primary : COLORS.borderEmpty;
    };

    const getEyeIconName = () => {
        return isPasswordVisible ? 'eye-off-outline' : 'eye-outline';
    };

    const getFinalBorderColor = () => {
        if (isError) return COLORS.red[500];
        if (isValid) return COLORS.green[500];
        return borderColor;
    };

    const getFinalLabelColor = () => {
        if (isError) return COLORS.red[500];
        if (isValid) return COLORS.green[500];
        return labelColor;
    };

    return (
        <TouchableWithoutFeedback onPress={onFocus}>
            <View style={styles.container}>
                <Text style={[
                    styles.label,
                    { color: getFinalLabelColor() }
                ]}>
                    Повторите пароль
                </Text>
                <View style={[
                    styles.inputContainer,
                    { borderColor: getFinalBorderColor() }
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
                {isError && (
                    <Text style={styles.errorText}>Пароли не совпадают</Text>
                )}
                {isValid && (
                    <Text style={styles.successText}>Пароли совпадают</Text>
                )}
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
        color: COLORS.red[500],
        fontSize: 14,
        marginTop: 8,
        marginLeft: 4,
    },
    successText: {
        color: COLORS.green[500],
        fontSize: 14,
        marginTop: 8,
        marginLeft: 4,
    },
});