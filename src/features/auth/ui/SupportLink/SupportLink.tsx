import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface SupportLinkProps {
    onPress: () => void;
}

export const SupportLink: React.FC<SupportLinkProps> = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Text style={styles.text}>связь с техподдержкой</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    text: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
    },
});