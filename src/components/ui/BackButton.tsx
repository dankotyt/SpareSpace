import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
    onPress: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Ionicons name="arrow-back" size={30} color={COLORS.primary} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});