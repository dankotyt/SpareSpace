import React from 'react';
import {View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import {Ionicons} from "@expo/vector-icons";
import {AdvertisementFormData, LocationData} from "@/types/advertisement";

interface BasicInfoStepProps {
    address: string;
    area: string;
    features: string[];
    location?: {
        latitude: number;
        longitude: number;
    };
    formData: AdvertisementFormData;
    onAddressChange: (address: string) => void;
    onAreaChange: (area: string) => void;
    onFeaturesChange: (features: string[]) => void;
    onLocationSelect: (locationData: LocationData) => void;
    navigation: any;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
                                                                address,
                                                                area,
                                                                features,
                                                                location,
                                                                onAddressChange,
                                                                onAreaChange,
                                                                onFeaturesChange,
                                                                onLocationSelect,
                                                                navigation
                                                            }) => {
    const commonFeatures = ['Охрана', 'Видеонаблюдение', 'Отопление', 'Электричество', 'Водоснабжение'];

    const toggleFeature = (feature: string) => {
        const newFeatures = features.includes(feature)
            ? features.filter(f => f !== feature)
            : [...features, feature];
        onFeaturesChange(newFeatures);
    };

    const handleSelectOnMap = () => {
        navigation.navigate('SelectLocationScreen', {
            initialLocation: location,
            onLocationSelected: (locationData: LocationData) => {
                onLocationSelect(locationData);
            }
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <View style={styles.locationHeader}>
                        <Text style={styles.label}>Местоположение</Text>
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={handleSelectOnMap}
                        >
                            <Ionicons name="map-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.mapButtonText}>
                                Выбрать на карте
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {location && (
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationText}>
                                Широта: {location.latitude.toFixed(6)}
                            </Text>
                            <Text style={styles.locationText}>
                                Долгота: {location.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Адрес</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={onAddressChange}
                        placeholder="Адрес будет заполнен автоматически после выбора на карте"
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
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    mapButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    locationInfo: {
        backgroundColor: COLORS.gray[100],
        padding: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.gray[600],
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