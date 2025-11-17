import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { COLORS } from '@/shared/constants/colors';
import {Listing} from "@/types/profile";
import {formatListingForDisplay} from "@shared/utils/priceFormatter";
import {useNavigation} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "@navigation/types";

interface AdvertisementDetailsProps {
    listing: Listing;
    onContactPress: () => void;
    onFavoritePress: () => void;
    onScroll?: (event: any) => void;
    scrollEnabled?: boolean;
}

export const AdvertisementDetails: React.FC<AdvertisementDetailsProps> = ({
                                                                              listing,
                                                                              onContactPress,
                                                                              onFavoritePress,
                                                                              onScroll,
                                                                              scrollEnabled = true,
                                                                          }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [isFavorite, setIsFavorite] = useState(false);
    const formattedListing = formatListingForDisplay(listing);

    const handleFavoritePress = () => {
        setIsFavorite(!isFavorite);
        onFavoritePress();
    };

    const handleMapPress = () => {
        navigation.navigate('MapScreen', { listing });
    };

    const getTypeLabel = () => {
        switch (listing.type) {
            case 'PARKING': return 'Парковочное место';
            case 'STORAGE': return 'Кладовое помещение';
            case 'GARAGE': return 'Гараж';
            default: return 'Помещение';
        }
    };

    const getAmenitiesList = () => {
        if (!listing.amenities) return [];

        if (Array.isArray(listing.amenities)) {
            return listing.amenities;
        }

        if (typeof listing.amenities === 'object') {
            return Object.entries(listing.amenities)
                .filter(([_, value]) => Boolean(value))
                .map(([key]) => key);
        }

        return [];
    };

    const getContactName = () => {
        if ((listing as any).user) {
            const user = (listing as any).user;
            const nameParts = [];
            if (user.firstName) nameParts.push(user.firstName);
            if (user.lastName) nameParts.push(user.lastName);
            if (user.patronymic) nameParts.push(user.patronymic);

            return nameParts.join(' ') || 'Не указано';
        }

        if (listing.contact?.name) {
            return listing.contact.name;
        }

        return 'Не указано';
    };

    const getAmenityLabel = (amenity: string) => {
        const amenityLabels: Record<string, string> = {
            heating: 'Отопление',
            security: 'Охрана',
            electricity: 'Электричество',
            ventilation: 'Вентиляция',
            lighting: 'Освещение',
            water: 'Водоснабжение',
            camera: 'Видеонаблюдение',
            parking: 'Парковка',
        };

        return amenityLabels[amenity] || amenity;
    };

    const parseLocation = (location: any) => {
        if (!location) return null;

        if (typeof location === 'object' && location.type === 'Point' && location.coordinates) {
            const [longitude, latitude] = location.coordinates;
            return { latitude, longitude };
        }

        if (typeof location === 'string') {
            const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match && match[1] && match[2]) {
                const longitude = parseFloat(match[1]);
                const latitude = parseFloat(match[2]);
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    return { latitude, longitude };
                }
            }
        }

        return null;
    };

    const getInitialRegion = () => {
        const coordinates = parseLocation(listing.location);

        if (coordinates) {
            return {
                ...coordinates,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        // Fallback на Москву если координат нет
        return {
            latitude: 55.7558,
            longitude: 37.6173,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPropertyDetails = () => {
        const details = [];

        if (listing.size) {
            details.push(`${listing.size} м²`);
        }

        switch (listing.type) {
            case 'PARKING':
                details.push('Парковочное место');
                break;
            case 'GARAGE':
                details.push('Гараж');
                break;
            case 'STORAGE':
                details.push('Кладовое помещение');
                break;
        }

        return details.join(' • ');
    };

    const parseAvailability = (availability: any) => {
        if (!availability) return [];

        if (Array.isArray(availability)) {
            return availability;
        }

        if (typeof availability === 'string') {
            try {
                const parsed = JSON.parse(availability);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }

        return [];
    };

    const availability = Array.isArray(listing.availability) ? listing.availability : [];

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            scrollEnabled={scrollEnabled}
        >
            {/* Заголовок и цена */}
            <View style={styles.header}>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{formattedListing.displayPrice}</Text>
                    <Text style={styles.priceSubtitle}>Хорошая цена</Text>
                </View>

                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={handleFavoritePress}
                >
                    <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={24}
                        color={isFavorite ? COLORS.red[50] : COLORS.gray[400]}
                    />
                </TouchableOpacity>
            </View>

            {/* Основная информация */}
            <View style={styles.section}>
                <Text style={styles.type}>{getTypeLabel()}</Text>
                <Text style={styles.propertyDetails}>{getPropertyDetails()}</Text>
                <Text style={styles.address}>{listing.address}</Text>
            </View>

            {/* Карта */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Расположение</Text>
                <TouchableOpacity style={styles.mapContainer} onPress={handleMapPress}>
                    <MapView
                        style={styles.map}
                        initialRegion={getInitialRegion()}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        {parseLocation(listing.location) && (
                            <Marker coordinate={parseLocation(listing.location)!} />
                        )}
                    </MapView>
                </TouchableOpacity>
            </View>

            {/* Контакты */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Контактное лицо</Text>
                <Text style={styles.contactName}>
                    {getContactName()}
                </Text>
                <Text style={styles.contactDate}>
                    Обновлено {formatDate(listing.updatedAt)}
                </Text>
            </View>

            {/* Просмотры */}
            {listing.views && (
                <View style={styles.section}>
                    <View style={styles.viewsContainer}>
                        <Text style={styles.viewsText}>
                            Всего просмотров: {listing.views.total || 0}
                        </Text>
                        <Text style={styles.viewsText}>
                            За сегодня: {listing.views.daily || 0}
                        </Text>
                    </View>
                </View>
            )}

            {/* Удобства */}
            {getAmenitiesList().length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Удобства</Text>
                    <View style={styles.amenitiesContainer}>
                        {getAmenitiesList().map((amenity, index) => (
                            <View key={index} style={styles.amenityTag}>
                                <Text style={styles.amenityText}>{getAmenityLabel(amenity)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Описание */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Описание</Text>
                <Text style={styles.description}>
                    {listing.description || 'Описание отсутствует'}
                </Text>
            </View>

            {/* Доступность */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Доступность</Text>
                <View style={styles.availabilityContainer}>
                    {availability.length > 0 ? (
                        availability.map((slot, index) => (
                            <View key={index} style={styles.availabilitySlot}>
                                <Text style={styles.availabilityText}>
                                    {formatDate(slot.start)} - {formatDate(slot.end)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noAvailability}>Нет данных о доступности</Text>
                    )}
                </View>
            </View>

            {/* Кнопка связи */}
            <TouchableOpacity style={styles.contactButton} onPress={onContactPress}>
                <Text style={styles.contactButtonText}>Позвонить</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    priceContainer: {
        flex: 1,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    priceSubtitle: {
        fontSize: 14,
        color: COLORS.green[500],
        marginTop: 4,
    },
    favoriteButton: {
        padding: 8,
    },
    section: {
        marginBottom: 20,
    },
    type: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    propertyDetails: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginBottom: 8,
    },
    address: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    mapContainer: {
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    contactDate: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    viewsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    viewsText: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    amenitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityTag: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    amenityText: {
        fontSize: 12,
        color: COLORS.primary,
    },
    description: {
        fontSize: 14,
        color: COLORS.gray[600],
        lineHeight: 20,
    },
    availabilityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    availabilitySlot: {
        backgroundColor: COLORS.gray[100],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    availabilityText: {
        fontSize: 12,
        color: COLORS.gray[700],
    },
    noAvailability: {
        fontSize: 14,
        color: COLORS.gray[500],
        fontStyle: 'italic',
    },
    contactButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
    },
    contactButtonText: {
        color: COLORS.textLight,
        fontSize: 16,
        fontWeight: '600',
    },
});