import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@components/ui/BackButton';
import { COLORS } from '@shared/constants/colors';
import { listingApiService, ListingResponse } from '@services/api/listingApi';
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@navigation/types";
import { useAuth } from '@hooks/auth/useAuth';
import { useAdvertisement } from '@services/AdvertisementContext';
import { normalize, wp, hp } from '@/shared/utils/scaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YaMap, {Marker, CameraPosition} from 'react-native-yamap';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<MapScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const { filterType, searchQuery, pricePeriod, listing } = route.params || {};
    const { isAuthenticated, user } = useAuth();
    const { userAds, refreshAds } = useAdvertisement();
    const [hasNoResults, setHasNoResults] = useState(false);
    const [listings, setListings] = useState<ListingResponse[]>([]);
    const [selectedListing, setSelectedListing] = useState<ListingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    const [cameraPosition, setCameraPosition] = useState<CameraPosition>({
        zoom: 12,
        tilt: 0,
        azimuth: 0,
        point: { lat: 55.7558, lon: 37.6173 },
        reason: 'APPLICATION',
        finished: true
    });

    const mapRef = useRef<YaMap>(null);

    const defaultCameraPosition = {
        lat: 55.7558,
        lon: 37.6173,
        zoom: 12,
        tilt: 0,
        azimuth: 0,
    };

    useEffect(() => {
        loadListings();
    }, [userAds.length, filterType, searchQuery, pricePeriod]);

    useEffect(() => {
        const listingParam = route.params?.listing;
        if (listingParam) {
            const coordinates = getListingCoordinates(listingParam);
            if (coordinates && mapRef.current && mapLoaded) {
                mapRef.current.setCenter(coordinates, 15, 0, 0, 1);
                setSelectedListing(listingParam);
            } else if (coordinates && mapLoaded) {
                setTimeout(() => {
                    if (mapRef.current) {
                        mapRef.current.setCenter(coordinates, 15, 0, 0, 1);
                        setSelectedListing(listingParam);
                    }
                }, 100);
            }
        }
    }, [route.params, mapLoaded]);

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
        if (!location) return null;

        try {
            const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match && match[1] && match[2]) {
                const longitude = parseFloat(match[1]);
                const latitude = parseFloat(match[2]);

                if (!isNaN(latitude) && !isNaN(longitude) &&
                    latitude >= -90 && latitude <= 90 &&
                    longitude >= -180 && longitude <= 180) {
                    return { latitude, longitude };
                }
            }
            return null;
        } catch (error) {
            console.error('❌ Error parsing location:', error);
            return null;
        }
    };

    const loadListings = async () => {
        try {
            setIsLoading(true);
            setHasNoResults(false);

            const listingsData = await listingApiService.getListings();

            let filteredListings = listingsData.filter(listing => {
                const isActive = listing.status === 'ACTIVE';
                const hasCoords = getListingCoordinates(listing) !== null;
                return isActive && hasCoords;
            });

            if (filterType && filterType !== 'SEARCH') {
                filteredListings = filteredListings.filter(listing => listing.type === filterType);
            }

            if (pricePeriod) {
                filteredListings = filteredListings.filter(listing => listing.pricePeriod === pricePeriod);
            }

            if (searchQuery) {
                const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2);
                filteredListings = filteredListings.filter(listing => {
                    const searchText = `
                        ${listing.title || ''} 
                        ${listing.description || ''} 
                        ${listing.address || ''}
                        ${getTypeLabel(listing.type)}
                    `.toLowerCase();
                    return searchTerms.some(term => searchText.includes(term));
                });
            }

            setListings(filteredListings);

            if (filteredListings.length === 0 && (filterType || pricePeriod || searchQuery)) {
                setHasNoResults(true);
            }
        } catch (error) {
            console.error('❌ MapScreen: Ошибка загрузки:', error);
            setListings([]);
            setHasNoResults(true);
        } finally {
            setIsLoading(false);
        }
    };

    const getListingCoordinates = (listing: ListingResponse): { lat: number; lon: number } | null => {
        if (!listing.location) return null;

        // GeoJSON Point
        if (typeof listing.location === 'object' && listing.location.type === 'Point') {
            const coordinates = listing.location.coordinates;
            if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
                const [lon, lat] = coordinates;
                if (isValidCoordinate(lat, lon)) {
                    return { lat, lon };
                }
            }
        }

        // WKT строка
        if (typeof listing.location === 'string') {
            const coords = parseLocation(listing.location);
            if (coords) {
                return { lat: coords.latitude, lon: coords.longitude };
            }
        }

        // Прямые координаты
        if (typeof listing.location === 'object') {
            const anyLocation = listing.location as any;
            if (anyLocation.longitude !== undefined && anyLocation.latitude !== undefined) {
                const { longitude, latitude } = anyLocation;
                if (isValidCoordinate(latitude, longitude)) {
                    return { lat: latitude, lon: longitude };
                }
            }
        }

        return null;
    };

    const isValidCoordinate = (lat: number, lng: number): boolean => {
        return !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180;
    };

    const handleBack = () => navigation.goBack();
    const handleMarkerPress = (listing: ListingResponse) => setSelectedListing(listing);
    const handleCloseModal = () => setSelectedListing(null);
    const handleRefresh = async () => await loadListings();

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
        if (listing.userId && user?.id) return listing.userId === user.id;
        return userAds.some(userAd => userAd.id === listing.id);
    };

    return (
        <View style={styles.container}>
            {!isLoading && hasNoResults && (
                <View style={styles.noResultsContainer}>
                    <View style={styles.noResultsContent}>
                        <Ionicons name="search-outline" size={normalize(64)} color={COLORS.gray[400]} />
                        <Text style={styles.noResultsTitle}>Ничего не найдено</Text>
                        <Text style={styles.noResultsText}>
                            {searchQuery
                                ? `По запросу "${searchQuery}" не найдено подходящих объявлений`
                                : 'По вашим критериям поиска ничего не найдено'}
                        </Text>
                        <TouchableOpacity
                            style={styles.showAllButton}
                            onPress={() => {
                                navigation.setParams({
                                    filterType: undefined,
                                    pricePeriod: undefined,
                                    searchQuery: undefined
                                });
                            }}
                        >
                            <Text style={styles.showAllButtonText}>Показать все объявления</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={[styles.header, { top: insets.top + normalize(10) }]}>
                <BackButton onPress={handleBack} filled={true} />
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={normalize(24)} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <YaMap
                ref={mapRef}
                style={styles.map}
                initialRegion={defaultCameraPosition}
                showUserPosition={true}
                nightMode={false}
                onMapLoaded={() => setMapLoaded(true)}
                onCameraPositionChange={(event) => {
                    const position = event.nativeEvent;
                    setCameraPosition({
                        zoom: position.zoom,
                        tilt: position.tilt,
                        azimuth: position.azimuth,
                        point: position.point,
                        reason: position.reason,
                        finished: position.finished
                    });
                }}
                scrollGesturesEnabled={true}
                zoomGesturesEnabled={true}
                tiltGesturesEnabled={true}
                rotateGesturesEnabled={true}
            >
                {listings.map((listing) => {
                    const coords = getListingCoordinates(listing);
                    if (!coords) return null;

                    const isOwn = isOwnListing(listing);
                    const markerColor = getMarkerColor(listing.type);

                    return (
                        <Marker
                            key={listing.id}
                            point={coords}
                            onPress={() => handleMarkerPress(listing)}
                        >
                            <View style={styles.marker}>
                                <View style={[
                                    styles.markerInner,
                                    {
                                        backgroundColor: markerColor,
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
                                    {isOwn && <Text style={styles.ownLabel}>Ваше</Text>}
                                </View>
                                <View style={[styles.markerArrow, { borderTopColor: markerColor }]} />
                            </View>
                        </Marker>
                    );
                })}
            </YaMap>

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

            {/* Модальное окно остаётся без изменений */}
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
                                        <Ionicons name="close" size={normalize(24)} color={COLORS.gray[500]} />
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
                                        <Ionicons name="location-outline" size={normalize(16)} color={COLORS.gray[500]} />
                                        <Text style={styles.modalAddress}>{selectedListing.address}</Text>
                                    </View>

                                    {selectedListing.amenities && Object.keys(selectedListing.amenities).length > 0 && (
                                        <View style={styles.amenitiesContainer}>
                                            <Text style={styles.amenitiesTitle}>Удобства:</Text>
                                            <View style={styles.amenitiesList}>
                                                {Object.entries(selectedListing.amenities)
                                                    .filter(([key, value]) => Boolean(value))
                                                    .map(([key]) => (
                                                        <Text key={key} style={styles.amenityItem}>
                                                            • {getAmenityLabel(key)}
                                                        </Text>
                                                    ))}
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
    container: { flex: 1 },
    header: {
        position: 'absolute',
        left: wp(4),
        right: wp(4),
        zIndex: 1000,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refreshButton: {
        backgroundColor: COLORS.white,
        padding: normalize(8),
        borderRadius: normalize(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: normalize(3.84),
        elevation: 5,
    },
    map: { flex: 1 },
    loadingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -100 }, { translateY: -25 }],
        backgroundColor: 'white',
        padding: normalize(20),
        borderRadius: normalize(10),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: normalize(3.84),
        elevation: 5,
    },
    loadingText: {
        marginTop: normalize(10),
        fontSize: normalize(14),
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
        backgroundColor: 'transparent',
    },
    emptyContent: {
        backgroundColor: 'white',
        padding: normalize(20),
        borderRadius: normalize(10),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: normalize(3.84),
        elevation: 5,
        minWidth: wp(50),
        maxWidth: wp(80),
    },
    emptyText: {
        fontSize: normalize(16),
        color: COLORS.gray[500],
        marginBottom: normalize(10),
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(8),
        borderRadius: normalize(8),
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: normalize(14),
        fontWeight: '600',
    },
    marker: { alignItems: 'center' },
    markerInner: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(6),
        borderRadius: normalize(8),
        minWidth: wp(25),
        alignItems: 'center',
        borderWidth: 2,
    },
    markerPrice: {
        color: COLORS.white,
        fontSize: normalize(12),
        fontWeight: 'bold',
        textAlign: 'center',
    },
    markerType: {
        color: COLORS.white,
        fontSize: normalize(10),
        textAlign: 'center',
        marginTop: normalize(2),
    },
    ownLabel: {
        color: COLORS.white,
        fontSize: normalize(8),
        fontWeight: 'bold',
        marginTop: normalize(2),
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: normalize(8),
        borderRightWidth: normalize(8),
        borderTopWidth: normalize(8),
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
        maxHeight: hp(80),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: wp(5),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[300],
    },
    modalTitleContainer: { flex: 1, marginRight: normalize(10) },
    modalType: {
        fontSize: normalize(14),
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: normalize(4),
    },
    modalTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ownBadge: {
        fontSize: normalize(12),
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: normalize(4),
    },
    closeButton: { padding: normalize(4) },
    modalBody: { padding: wp(5) },
    modalPrice: {
        fontSize: normalize(24),
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: normalize(8),
    },
    modalSize: {
        fontSize: normalize(16),
        color: COLORS.gray[600],
        marginBottom: normalize(12),
    },
    modalDescription: {
        fontSize: normalize(16),
        lineHeight: normalize(22),
        marginBottom: normalize(15),
        color: COLORS.gray[600],
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(15),
    },
    modalAddress: {
        fontSize: normalize(14),
        color: COLORS.gray[500],
        marginLeft: normalize(5),
        flex: 1,
    },
    amenitiesContainer: { marginBottom: normalize(15) },
    amenitiesTitle: {
        fontSize: normalize(16),
        fontWeight: '600',
        marginBottom: normalize(8),
        color: COLORS.text,
    },
    amenitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityItem: {
        fontSize: normalize(14),
        color: COLORS.gray[600],
        marginRight: normalize(15),
        marginBottom: normalize(4),
    },
    contactButton: {
        backgroundColor: COLORS.primary,
        margin: wp(5),
        padding: normalize(16),
        borderRadius: normalize(12),
        alignItems: 'center',
    },
    contactButtonText: {
        color: COLORS.white,
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
    noResultsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1001,
    },
    noResultsContent: {
        backgroundColor: COLORS.white,
        padding: wp(6),
        borderRadius: normalize(16),
        alignItems: 'center',
        marginHorizontal: wp(5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: normalize(8),
        elevation: 4,
    },
    noResultsTitle: {
        fontSize: normalize(20),
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: normalize(16),
        marginBottom: normalize(8),
    },
    noResultsText: {
        fontSize: normalize(16),
        color: COLORS.gray[600],
        textAlign: 'center',
        lineHeight: normalize(22),
        marginBottom: normalize(20),
    },
    showAllButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: wp(5),
        paddingVertical: normalize(12),
        borderRadius: normalize(8),
    },
    showAllButtonText: {
        color: COLORS.white,
        fontSize: normalize(16),
        fontWeight: '600',
    },
});

export default MapScreen;