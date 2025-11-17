import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import MapView, {Marker, PROVIDER_DEFAULT, Region} from 'react-native-maps';
import {Ionicons} from '@expo/vector-icons';
import {BackButton} from '@/components/ui/BackButton';
import {COLORS} from '@/shared/constants/colors';
import {listingApiService, ListingResponse} from '@/services/api/listingApi'
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "@navigation/types";
import {useAuth} from '@/hooks/useAuth';
import {useAdvertisement} from '@/services/AdvertisementContext';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<MapScreenRouteProp>();
    const { isAuthenticated } = useAuth();
    const { userAds, refreshAds } = useAdvertisement();

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
    }, [userAds.length]);

    useEffect(() => {
        if (route.params?.listing) {
            const coordinates = getListingCoordinates(route.params.listing);
            if (coordinates) {
                setRegion({
                    ...coordinates,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
                setSelectedListing(route.params.listing);
            }
        }
    }, [route.params]);

    useEffect(() => {
        if (isAuthenticated && userAds.length > 0) {
            const allListings = [...listings];
            userAds.forEach(userAd => {
                const existingIndex = allListings.findIndex(ad => ad.id === userAd.id);
                if (existingIndex === -1) {
                    allListings.push(userAd);
                }
            });
            setListings(allListings);
        }
    }, [userAds, isAuthenticated]);

    const parseLocation = (location: string): { latitude: number; longitude: number } | null => {
        if (!location || typeof location !== 'string') {
            return null;
        }

        try {
            console.log('🔍 Attempting to parse location as WKT:', location);

            // Формат: "POINT(longitude latitude)"
            const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match && match[1] && match[2]) {
                const longitude = parseFloat(match[1]);
                const latitude = parseFloat(match[2]);

                if (!isNaN(latitude) && !isNaN(longitude) &&
                    latitude >= -90 && latitude <= 90 &&
                    longitude >= -180 && longitude <= 180) {

                    console.log('✅ Successfully parsed WKT coordinates:', { latitude, longitude });
                    return { latitude, longitude };
                }
            }

            console.log('❌ Location is not in WKT format or coordinates are invalid');
            return null;
        } catch (error) {
            console.error('❌ Error parsing location:', error);
            return null;
        }
    };

    const loadListings = async () => {
        try {
            setIsLoading(true);
            console.log('🔄 MapScreen: Загрузка объявлений...');

            const listingsData = await listingApiService.getListings();
            console.log('📋 MapScreen: Получено объявлений:', listingsData.length);

            const activeListings = listingsData.filter(listing => {
                const isActive = listing.status === 'ACTIVE';
                const hasCoords = getListingCoordinates(listing) !== null;

                console.log(`📍 Listing ${listing.id}: active=${isActive}, hasCoords=${hasCoords}`);

                return isActive && hasCoords;
            });

            console.log('✅ MapScreen: Активных объявлений с координатами:', activeListings.length);
            setListings(activeListings);

        } catch (error) {
            console.error('❌ MapScreen: Ошибка загрузки:', error);
            setListings([]);
        } finally {
            setIsLoading(false);
        }
    };

    // MapScreen.tsx
    const getListingCoordinates = (listing: ListingResponse): { latitude: number; longitude: number } | null => {
        console.log('🔍 getListingCoordinates для listing:', {
            id: listing.id,
            location: listing.location,
            locationType: typeof listing.location
        });

        if (!listing.location) {
            console.log('❌ Нет location в listing');
            return null;
        }

        // Если location - GeoJSONPoint объект
        if (typeof listing.location === 'object' && listing.location.type === 'Point') {
            console.log('📍 Location is GeoJSON Point:', listing.location);

            const coordinates = listing.location.coordinates;

            if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
                // В GeoJSON порядок: [longitude, latitude]
                const [longitude, latitude] = coordinates;

                console.log('📌 GeoJSON coordinates:', { longitude, latitude });

                if (isValidCoordinate(latitude, longitude)) {
                    console.log('✅ Valid coordinates from GeoJSON');
                    return { latitude, longitude };
                } else {
                    console.log('❌ Invalid coordinate values in GeoJSON');
                }
            } else {
                console.log('❌ Invalid coordinates array in GeoJSON');
            }
        }

        // Если location - строка (WKT формат)
        if (typeof listing.location === 'string') {
            console.log('📍 Location is string:', listing.location);
            const coords = parseLocation(listing.location);
            if (coords) {
                console.log('✅ Valid coordinates from WKT string');
                return coords;
            }
        }

        // Если location - объект с прямыми координатами (старый формат)
        if (typeof listing.location === 'object') {
            console.log('📍 Location is plain object:', listing.location);

            // Проверяем прямой доступ к координатам
            const anyLocation = listing.location as any;
            if (anyLocation.longitude !== undefined && anyLocation.latitude !== undefined) {
                const { longitude, latitude } = anyLocation;
                console.log('📌 Direct coordinates:', { longitude, latitude });

                if (isValidCoordinate(latitude, longitude)) {
                    console.log('✅ Valid coordinates from direct access');
                    return { latitude, longitude };
                }
            }
        }

        console.log('❌ No valid coordinates found');
        return null;
    };

    const isValidCoordinate = (lat: number, lng: number): boolean => {
        const valid =
            !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180;

        console.log(`📏 Coordinate validation: lat=${lat}, lng=${lng}, valid=${valid}`);
        return valid;
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

    const handleRefresh = async () => {
        await loadListings();
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
            ventilation: 'Вентиляция',
            lighting: 'Освещение',
            water: 'Водоснабжение',
            camera: 'Видеонаблюдение',
        };

        return amenityLabels[key] || key;
    };

    const isOwnListing = (listing: ListingResponse): boolean => {
        if (!isAuthenticated) return false;
        return userAds.some(userAd => userAd.id === listing.id);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={handleBack} filled={true}/>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={24} color={COLORS.primary} />
                </TouchableOpacity>
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

                    const isOwn = isOwnListing(listing);

                    return (
                        <Marker
                            key={listing.id}
                            coordinate={coordinates}
                            onPress={() => handleMarkerPress(listing)}
                        >
                            <View style={styles.marker}>
                                <View style={[
                                    styles.markerInner,
                                    {
                                        backgroundColor: getMarkerColor(listing.type),
                                        borderColor: isOwn ? COLORS.primary : 'transparent',
                                        borderWidth: isOwn ? 2 : 0
                                    }
                                ]}>
                                    <Text style={styles.markerPrice}>
                                        {getPriceText(listing.price, listing.pricePeriod)}
                                    </Text>
                                    <Text style={styles.markerType}>
                                        {getTypeLabel(listing.type)}
                                    </Text>
                                    {isOwn && (
                                        <Text style={styles.ownLabel}>Ваше</Text>
                                    )}
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

            {!isLoading && listings.length === 0 && (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyContent}>
                        <Text style={styles.emptyText}>Нет доступных объявлений</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                            <Text style={styles.retryButtonText}>Попробовать снова</Text>
                        </TouchableOpacity>
                    </View>
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
                                        {isOwnListing(selectedListing) && (
                                            <Text style={styles.ownBadge}>Ваше объявление</Text>
                                        )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refreshButton: {
        backgroundColor: COLORS.white,
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
    emptyContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // прозрачный фон для всего контейнера
    },
    emptyContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 200, // минимальная ширина
        maxWidth: '80%', // максимальная ширина 80% экрана
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.gray[500],
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
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
        borderWidth: 2,
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
    ownLabel: {
        color: COLORS.primary,
        fontSize: 8,
        fontWeight: 'bold',
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
    ownBadge: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 4,
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