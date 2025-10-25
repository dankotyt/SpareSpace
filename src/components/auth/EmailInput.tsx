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

interface EmailInputProps {
    value: string;
    isFocused: boolean;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({
                                                          value,
                                                          isFocused,
                                                          onChangeText,
                                                          onFocus,
                                                          onBlur,
                                                      }) => {

    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused);

    return (
        <TouchableWithoutFeedback onPress={onFocus}>
            <View style={styles.container}>
                <Text style={[
                    styles.label,
                    { color: labelColor }
                ]}>
                    Электронная почта
                </Text>
                <View style={[
                    styles.inputContainer,
                    {
                        borderColor: borderColor,
                    }
                ]}>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: textColor,
                            }
                        ]}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        selectionColor={COLORS.primary}
                    />
                </View>
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
});