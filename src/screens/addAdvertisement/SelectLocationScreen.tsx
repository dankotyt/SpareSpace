import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { RootStackParamList } from '@/navigation/types';
import { geocodingService } from '@/services/mapGeocodingService';
import debounce from 'lodash/debounce';
import {LocationData} from "@/types/advertisement";

type SelectLocationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SelectLocationScreen'>;

export const SelectLocationScreen: React.FC = () => {
    const navigation = useNavigation<SelectLocationScreenNavigationProp>();
    const route = useRoute();

    const params = route.params as any;
    const [selectedLocation, setSelectedLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(params?.initialLocation || null);

    const [currentAddress, setCurrentAddress] = useState<string>('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [region, setRegion] = useState<Region>({
        latitude: 55.7558,
        longitude: 37.6173,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    const mapRef = useRef<MapView>(null);
    const onLocationSelect = params?.onLocationSelect;
    const debouncedGeocode = useCallback(
        debounce(async (location: { latitude: number; longitude: number }) => {
            try {
                setIsLoadingAddress(true);
                const address = await geocodingService.reverseGeocode(location);
                setCurrentAddress(address);
            } catch (error) {
                console.error('Error getting address:', error);
                setCurrentAddress('Не удалось определить адрес');
            } finally {
                setIsLoadingAddress(false);
            }
        }, 500),
        []
    );

    const handleMapPress = (event: any) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
        debouncedGeocode(coordinate);
    };

    const handleRegionChange = (newRegion: Region) => {
        setRegion(newRegion);
    };

    const handleConfirmLocation = async () => {
        if (!selectedLocation) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите местоположение на карте');
            return;
        }

        try {
            setIsLoadingAddress(true);
            const address = currentAddress || await geocodingService.reverseGeocode(selectedLocation);

            const locationData: LocationData = {
                ...selectedLocation,
                address
            };

            const onLocationSelected = (route.params as any)?.onLocationSelected;

            if (onLocationSelected) {
                onLocationSelected(locationData);
            }

            navigation.goBack();

        } catch (error) {
            console.error('Error getting address:', error);
            Alert.alert('Ошибка', 'Не удалось определить адрес. Попробуйте еще раз.');
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={handleBack} backgroundColor={COLORS.white}/>
                <Text style={styles.title}>Выберите местоположение</Text>
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                region={region}
                onRegionChangeComplete={handleRegionChange}
                onPress={handleMapPress}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
            >
                {selectedLocation && (
                    <Marker coordinate={selectedLocation}>
                        <View style={styles.marker}>
                            <Ionicons name="location" size={32} color={COLORS.primary} />
                        </View>
                    </Marker>
                )}
            </MapView>

            <View style={styles.instruction}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                    Нажмите на карту, чтобы выбрать местоположение
                </Text>
            </View>

            {(selectedLocation || isLoadingAddress) && (
                <View style={styles.addressContainer}>
                    {isLoadingAddress ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Определяем адрес...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.addressTitle}>Выбранный адрес:</Text>
                            <Text style={styles.addressText}>{currentAddress}</Text>
                            <View style={styles.coordinates}>
                                <Text style={styles.coordinateText}>
                                    Широта: {selectedLocation?.latitude.toFixed(6)}
                                </Text>
                                <Text style={styles.coordinateText}>
                                    Долгота: {selectedLocation?.longitude.toFixed(6)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (!selectedLocation || isLoadingAddress) && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmLocation}
                    disabled={!selectedLocation || isLoadingAddress}
                >
                    {isLoadingAddress ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.confirmButtonText}>
                            Подтвердить местоположение
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 12,
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    marker: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    instruction: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 12,
        borderRadius: 8,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    instructionText: {
        fontSize: 14,
        color: COLORS.text,
        flex: 1,
    },
    addressContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 12,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    addressTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '500',
        marginBottom: 8,
    },
    coordinates: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    coordinateText: {
        fontSize: 12,
        color: COLORS.gray[600],
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.gray[600],
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.gray[400],
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SelectLocationScreen;