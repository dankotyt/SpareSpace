import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
    return (
        <View style={styles.container}>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${(currentStep / totalSteps) * 100}%` }
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: COLORS.gray[200],
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
});