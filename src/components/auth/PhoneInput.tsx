import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableWithoutFeedback
} from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { getInputColors } from '@/shared/utils/inputColors';
import { formatPhoneNumber } from '@/shared/utils/phoneFormatter';

interface PhoneInputProps {
    value: string;
    isFocused: boolean;
    error?: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
                                                          value,
                                                          isFocused,
                                                          error,
                                                          onChangeText,
                                                          onFocus,
                                                          onBlur,
                                                      }) => {
    const handleTextChange = (text: string) => {
        const formatted = formatPhoneNumber(text);
        onChangeText(formatted);
    };

    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused, error);

    return (
        <TouchableWithoutFeedback onPress={onFocus}>
            <View style={styles.container}>
                <Text style={[
                    styles.label,
                    { color: labelColor }
                ]}>
                    Номер телефона
                </Text>
                <View style={[
                    styles.inputContainer,
                    {
                        borderColor,
                    }
                ]}>
                    <TextInput
                        style={[
                            styles.input,
                            { color: textColor },
                        ]}
                        value={value}
                        onChangeText={handleTextChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        keyboardType="phone-pad"
                        maxLength={16}
                        selectionColor={COLORS.primary}
                    />
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
        marginTop: 0,
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
    },
    input: {
        fontSize: 18,
        paddingVertical: 12,
        fontWeight: '500',
        padding: 0,
    },
    errorText: {
        color: COLORS.red[50],
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});