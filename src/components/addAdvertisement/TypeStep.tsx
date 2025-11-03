import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface TypeStepProps {
    selectedType: string | null;
    onTypeSelect: (type: 'PARKING' | 'STORAGE' | 'GARAGE') => void;
}

export const TypeStep: React.FC<TypeStepProps> = ({ selectedType, onTypeSelect }) => {
    const types = [
        {
            id: 'PARKING' as const,
            title: 'Парковочное место',
            description: 'Подходит для автомобилей'
        },
        {
            id: 'STORAGE' as const,
            title: 'Кладовка',
            description: 'Подходит для хранения вещей'
        },
        {
            id: 'GARAGE' as const,
            title: 'Гараж',
            description: 'Подходит для автомобилей или хранения вещей'
        }
    ];

    return (
        <View style={styles.container}>

            <View style={styles.typesContainer}>
                {types.map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        style={[
                            styles.typeCard,
                            selectedType === type.id && styles.typeCardSelected
                        ]}
                        onPress={() => onTypeSelect(type.id)}
                    >
                        <View style={styles.typeContent}>
                            <Text style={[
                                styles.typeTitle,
                                selectedType === type.id && styles.typeTitleSelected
                            ]}>
                                {type.title}
                            </Text>
                            <Text style={[
                                styles.typeDescription,
                                selectedType === type.id && styles.typeDescriptionSelected
                            ]}>
                                {type.description}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    typesContainer: {
        gap: 12,
    },
    typeCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: COLORS.gray[200],
    },
    typeCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    typeContent: {
        gap: 4,
    },
    typeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    typeTitleSelected: {
        color: COLORS.primary,
    },
    typeDescription: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    typeDescriptionSelected: {
        color: COLORS.primary,
    },
});