import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { ListingResponse } from '@/services/api/listingApi'
import { listingApiService } from '@/services/api/listingApi';
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "@navigation/types";

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [region, setRegion] = useState<Region>({
        latitude: 55.7558,
        longitude: 37.6173,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [listings, setListings] = useState<ListingResponse[]>([]);
    const [selectedListing, setSelectedListing] = useState<ListingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        loadListings();
    }, []);

    // Функция для парсинга WKT строки в координаты
    const parseLocation = (location: string): { latitude: number; longitude: number } | null => {
        if (!location) return null;

        try {
            // Формат: "POINT(longitude latitude)"
            const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
                const longitude = parseFloat(match[1]);
                const latitude = parseFloat(match[2]);
                return { latitude, longitude };
            }
        } catch (error) {
            console.error('Error parsing location:', error);
        }
        return null;
    };

    const loadListings = async () => {
        try {
            setIsLoading(true);
            const listingsData = await listingApiService.getListings();

            // Фильтруем активные объявления с координатами
            const activeListings = listingsData.filter(listing => {
                if (listing.status !== 'ACTIVE') return false;

                // Проверяем наличие координат через location поле
                if (listing.location) {
                    const coords = parseLocation(listing.location);
                    return coords !== null;
                }

            });

            setListings(activeListings);
        } catch (error) {
            console.error('Error loading listings:', error);
            loadDemoListings();
        } finally {
            setIsLoading(false);
        }
    };

    const loadDemoListings = () => {
        const demoListings: ListingResponse[] = [
            {
                id: 1,
                type: 'GARAGE',
                title: 'Теплый гараж в центре',
                description: 'Отапливаемый гараж с охраной, видеонаблюдение',
                price: 3000,
                pricePeriod: 'MONTH',
                currency: 'RUB',
                address: 'Москва, ул. Тверская, 15',
                location: 'POINT(37.6184 55.7604)', // WKT формат
                size: 20,
                photosJson: [],
                amenities: { heating: true, security: true },
                availability: [],
                userId: 1,
                status: 'ACTIVE',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 2,
                type: 'GARAGE',
                title: 'Гараж в спальном районе',
                description: 'Удобный подъезд, видеонаблюдение, электричество',
                price: 2000,
                pricePeriod: 'MONTH',
                currency: 'RUB',
                address: 'Москва, ул. Ленинский проспект, 120',
                location: 'POINT(37.5544 55.6904)', // WKT формат
                size: 18,
                photosJson: [],
                amenities: { electricity: true, security: true },
                availability: [],
                userId: 1,
                status: 'ACTIVE',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 3,
                type: 'PARKING',
                title: 'Подземный паркинг',
                description: 'Охраняемая территория, лифт, отопление',
                price: 5000,
                pricePeriod: 'MONTH',
                currency: 'RUB',
                address: 'Москва, Пресненская наб., 12',
                location: 'POINT(37.5424 55.7494)', // WKT формат
                size: 12,
                photosJson: [],
                amenities: { heating: true, security: true, elevator: true },
                availability: [],
                userId: 1,
                status: 'ACTIVE',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            }
        ];
        setListings(demoListings);
    };

    const getListingCoordinates = (listing: ListingResponse): { latitude: number; longitude: number } | null => {
        if (listing.location) {
            const coords = parseLocation(listing.location);
            if (coords) return coords;
        }

        return null;
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleMarkerPress = (listing: ListingResponse) => {
        setSelectedListing(listing);
    };

    const handleCloseModal = () => {
        setSelectedListing(null);
    };

    const onMapReady = () => {
        setMapLoaded(true);
    };

    const getTypeLabel = (type: string): string => {
        switch (type) {
            case 'PARKING': return 'Парковочное место';
            case 'STORAGE': return 'Кладовое помещение';
            case 'GARAGE': return 'Гараж';
            default: return 'Помещение';
        }
    };

    const getPriceText = (price: number, period: string): string => {
        const periodLabels: Record<string, string> = {
            HOUR: 'час',
            DAY: 'сутки',
            WEEK: 'неделя',
            MONTH: 'месяц'
        };

        return `${price.toLocaleString('ru-RU')} ₽/${periodLabels[period] || period.toLowerCase()}`;
    };

    const getMarkerColor = (type: string): string => {
        switch (type) {
            case 'GARAGE': return COLORS.primary;
            case 'PARKING': return '#4CAF50';
            case 'STORAGE': return '#FF9800';
            default: return COLORS.primary;
        }
    };

    const getAmenityLabel = (key: string): string => {
        const amenityLabels: Record<string, string> = {
            heating: 'Отопление',
            security: 'Охрана',
            electricity: 'Электричество',
            elevator: 'Лифт',
            ventilation: 'Вентиляция',
            lighting: 'Освещение',
            water: 'Водоснабжение',
            wifi: 'Wi-Fi',
            camera: 'Видеонаблюдение',
        };

        return amenityLabels[key] || key;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={handleBack} />
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                region={region}
                onRegionChangeComplete={setRegion}
                onMapReady={onMapReady}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
            >
                {listings.map((listing) => {
                    const coordinates = getListingCoordinates(listing);
                    if (!coordinates) return null;

                    return (
                        <Marker
                            key={listing.id}
                            coordinate={coordinates}
                            onPress={() => handleMarkerPress(listing)}
                        >
                            <View style={styles.marker}>
                                <View style={[styles.markerInner, { backgroundColor: getMarkerColor(listing.type) }]}>
                                    <Text style={styles.markerPrice}>
                                        {getPriceText(listing.price, listing.pricePeriod)}
                                    </Text>
                                    <Text style={styles.markerType}>
                                        {getTypeLabel(listing.type)}
                                    </Text>
                                </View>
                                <View style={[styles.markerArrow, { borderTopColor: getMarkerColor(listing.type) }]} />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Загрузка объявлений...</Text>
                </View>
            )}

            <Modal
                visible={!!selectedListing}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedListing && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitleContainer}>
                                        <Text style={styles.modalType}>
                                            {getTypeLabel(selectedListing.type)}
                                        </Text>
                                        <Text style={styles.modalTitle}>{selectedListing.title}</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color={COLORS.gray[500]} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalBody}>
                                    <Text style={styles.modalPrice}>
                                        {getPriceText(selectedListing.price, selectedListing.pricePeriod)}
                                    </Text>

                                    {selectedListing.size && (
                                        <Text style={styles.modalSize}>
                                            Площадь: {selectedListing.size} м²
                                        </Text>
                                    )}

                                    <Text style={styles.modalDescription}>{selectedListing.description}</Text>

                                    <View style={styles.addressContainer}>
                                        <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
                                        <Text style={styles.modalAddress}>{selectedListing.address}</Text>
                                    </View>

                                    {selectedListing.amenities && Object.keys(selectedListing.amenities).length > 0 && (
                                        <View style={styles.amenitiesContainer}>
                                            <Text style={styles.amenitiesTitle}>Удобства:</Text>
                                            <View style={styles.amenitiesList}>
                                                {Object.entries(selectedListing.amenities)
                                                    .filter(([key, value]) => Boolean(value))
                                                    .map(([key, value]) => (
                                                        <Text key={key} style={styles.amenityItem}>
                                                            • {getAmenityLabel(key)}
                                                        </Text>
                                                    ))
                                                }
                                            </View>
                                        </View>
                                    )}
                                </ScrollView>

                                <TouchableOpacity style={styles.contactButton}>
                                    <Text style={styles.contactButtonText}>Связаться с арендодателем</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Стили остаются без изменений
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1000,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    loadingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -75 }, { translateY: -25 }],
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: COLORS.gray[500],
    },
    marker: {
        alignItems: 'center',
    },
    markerInner: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    markerPrice: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    markerType: {
        color: COLORS.white,
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[300],
    },
    modalTitleContainer: {
        flex: 1,
        marginRight: 10,
    },
    modalType: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    modalPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    modalSize: {
        fontSize: 16,
        color: COLORS.gray[600],
        marginBottom: 12,
    },
    modalDescription: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 15,
        color: COLORS.gray[600],
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalAddress: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginLeft: 5,
        flex: 1,
    },
    amenitiesContainer: {
        marginBottom: 15,
    },
    amenitiesTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: COLORS.text,
    },
    amenitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityItem: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginRight: 15,
        marginBottom: 4,
    },
    contactButton: {
        backgroundColor: COLORS.primary,
        margin: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    contactButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MapScreen;