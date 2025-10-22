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
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
                                                                value,
                                                                isFocused,
                                                                onChangeText,
                                                                onFocus,
                                                                onBlur,
                                                            }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const getEyeIconColor = () => {
        return isPasswordVisible ? COLORS.primary : COLORS.borderEmpty;
    };

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
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
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
});