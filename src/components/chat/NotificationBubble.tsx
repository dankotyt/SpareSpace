import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface NotificationBubbleProps {
    count: number;
    onPress?: () => void;
    color?: string;
    enabled?: boolean;
}

export const NotificationBubble: React.FC<NotificationBubbleProps> = ({
                                                                          count,
                                                                          onPress,
                                                                          color = COLORS.primary,
                                                                          enabled = true
                                                                      }) => {
    if (!enabled || count <= 0) return null;

    return (
        <TouchableOpacity
            style={[styles.bubble, { backgroundColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={styles.bubbleText}>
                {count > 99 ? '99+' : count}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    bubble: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    bubbleText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 6,
    },
});