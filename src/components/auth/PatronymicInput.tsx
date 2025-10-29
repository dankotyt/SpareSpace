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

interface PatronymicInputProps {
    value: string;
    isFocused: boolean;
    error?: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}

export const PatronymicInput: React.FC<PatronymicInputProps> = ({
                                                                    value,
                                                                    isFocused,
                                                                    error,
                                                                    onChangeText,
                                                                    onFocus,
                                                                    onBlur,
                                                                }) => {

    const { borderColor, textColor, labelColor } = getInputColors(value, isFocused, error);

    return (
        <TouchableWithoutFeedback onPress={onFocus}>
            <View style={styles.container}>
                <View style={styles.labelContainer}>
                    <Text style={[
                        styles.label,
                        { color: labelColor }
                    ]}>
                        Отчество (необязательно)
                    </Text>
                </View>
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
                        placeholderTextColor={COLORS.gray[400]}
                        autoCapitalize="words"
                        autoComplete="name"
                        autoCorrect={false}
                        selectionColor={COLORS.primary}
                        maxLength={50}
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
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 8,
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