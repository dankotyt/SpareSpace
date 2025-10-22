import React from 'react';
import {View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface BasicInfoStepProps {
    address: string;
    area: string;
    features: string[];
    onAddressChange: (address: string) => void;
    onAreaChange: (area: string) => void;
    onFeaturesChange: (features: string[]) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
                                                                address,
                                                                area,
                                                                features,
                                                                onAddressChange,
                                                                onAreaChange,
                                                                onFeaturesChange,
                                                            }) => {
    const commonFeatures = ['Охрана', 'Видеонаблюдение', 'Отопление', 'Электричество', 'Водоснабжение'];

    const toggleFeature = (feature: string) => {
        const newFeatures = features.includes(feature)
            ? features.filter(f => f !== feature)
            : [...features, feature];
        onFeaturesChange(newFeatures);
    };

    return (
        <ScrollView style={styles.container}>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Адрес</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={onAddressChange}
                        placeholder="Введите адрес"
                        placeholderTextColor={COLORS.gray[400]}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Площадь</Text>
                    <TextInput
                        style={styles.input}
                        value={area}
                        onChangeText={onAreaChange}
                        placeholder="Введите площадь в м²"
                        placeholderTextColor={COLORS.gray[400]}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Главные особенности</Text>
                    <View style={styles.featuresContainer}>
                        {commonFeatures.map((feature) => (
                            <TouchableOpacity
                                key={feature}
                                style={[
                                    styles.featureButton,
                                    features.includes(feature) && styles.featureButtonSelected
                                ]}
                                onPress={() => toggleFeature(feature)}
                            >
                                <Text style={[
                                    styles.featureText,
                                    features.includes(feature) && styles.featureTextSelected
                                ]}>
                                    {feature}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray[300],
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    featureButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray[300],
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    featureButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    featureText: {
        fontSize: 14,
        color: COLORS.text,
    },
    featureTextSelected: {
        color: COLORS.white,
    },
});