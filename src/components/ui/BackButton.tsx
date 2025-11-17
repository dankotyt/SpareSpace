import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
    onPress: () => void;
    color?: string;
    backgroundColor?: string;
    filled?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
                                                          onPress,
                                                          color = COLORS.primary,
                                                          backgroundColor = 'rgba(0, 0, 0, 0.3)',
                                                          filled = false
                                                      }) => {
    const containerBackgroundColor = filled
        ? COLORS.white
        : backgroundColor;

    const iconColor = filled ? COLORS.primary : color;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: containerBackgroundColor }
            ]}
            onPress={onPress}
        >
            <Ionicons name="arrow-back" size={30} color={iconColor} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});