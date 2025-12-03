import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { listingApiService } from '@/services/api/listingApi';

interface PinnedAdProps {
    listingId: number;
    onPress?: (listingId: number) => void;
}

export const PinnedAd: React.FC<PinnedAdProps> = ({ listingId, onPress }) => {
    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadListing = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!listingId || listingId <= 0) {
                    setError('Некорректный ID объявления');
                    setLoading(false);
                    return;
                }

                const data = await listingApiService.getListingById(listingId);
                console.log('✅ PinnedAd loaded listing:', data);
                setListing(data);
            } catch (err: any) {
                console.error('❌ Error loading listing in PinnedAd:', err);
                setError(err.message || 'Ошибка загрузки объявления');
            } finally {
                setLoading(false);
            }
        };

        loadListing();
    }, [listingId]);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка объявления...</Text>
            </View>
        );
    }

    if (error || !listing) {
        console.log('PinnedAd not rendered due to:', error || 'No listing');
        return null;
    }

    const formatPrice = (price: number, period?: string) => {
        const periodText = {
            'HOUR': 'час',
            'DAY': 'день',
            'WEEK': 'неделя',
            'MONTH': 'месяц'
        }[period || 'DAY'] || 'день';

        return `${price.toLocaleString('ru-RU')} ₽/${periodText}`;
    };

    const getFirstPhoto = () => {
        if (!listing) return null;

        console.log('Listing photos structure:', {
            photoUrls: listing.photoUrls,
            photosJson: listing.photosJson,
            photos: listing.photos,
            images: listing.images
        });

        if (listing.photoUrls && Array.isArray(listing.photoUrls) && listing.photoUrls.length > 0) {
            return listing.photoUrls[0];
        }

        if (listing.photosJson && Array.isArray(listing.photosJson) && listing.photosJson.length > 0) {
            return listing.photosJson[0];
        }

        if (listing.photos) {
            if (Array.isArray(listing.photos) && listing.photos.length > 0) {
                return listing.photos[0];
            }

            if (typeof listing.photos === 'string') {
                try {
                    const parsedPhotos = JSON.parse(listing.photos);
                    if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
                        return parsedPhotos[0];
                    }
                } catch (e) {
                    console.error('Error parsing photos string:', e);
                }
            }
        }

        if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
            return listing.images[0];
        }

        return null;
    };

    const firstPhoto = getFirstPhoto();
    console.log('First photo URL:', firstPhoto);

    const getListingType = () => {
        switch (listing.type) {
            case 'PARKING': return 'Парковочное место';
            case 'GARAGE': return 'Гараж';
            case 'STORAGE': return 'Кладовая';
            default: return 'Объявление';
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(listingId)}
            activeOpacity={0.7}
        >
            {/* Бейдж "Объявление" */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>Объявление</Text>
            </View>

            <View style={styles.content}>
                {/* Изображение */}
                {firstPhoto ? (
                    <Image
                        source={{ uri: firstPhoto }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    />
                ) : (
                    <View style={[styles.image, styles.noImage]}>
                        <Text style={styles.noImageText}>{getListingType()}</Text>
                    </View>
                )}

                {/* Информация */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={2}>
                        {listing.title || `${getListingType()} - ${listing.address || 'Без адреса'}`}
                    </Text>

                    {listing.address && (
                        <Text style={styles.address} numberOfLines={1}>
                            📍 {listing.address}
                        </Text>
                    )}

                    <Text style={styles.price}>
                        {formatPrice(listing.price || 0, listing.pricePeriod)}
                    </Text>

                    {listing.description && (
                        <Text style={styles.description} numberOfLines={1}>
                            {listing.description}
                        </Text>
                    )}
                </View>

                {/* Стрелка */}
                <View style={styles.arrow}>
                    <Text style={styles.arrowText}>›</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginHorizontal: 12,
        marginTop: 8,
        marginBottom: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 12,
        color: COLORS.gray[500],
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '600',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 12,
    },
    noImage: {
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray[300],
    },
    noImageText: {
        fontSize: 10,
        color: COLORS.gray[600],
        textAlign: 'center',
        paddingHorizontal: 4,
        fontWeight: '500',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray[900],
        marginBottom: 4,
        lineHeight: 18,
    },
    address: {
        fontSize: 12,
        color: COLORS.gray[600],
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    description: {
        fontSize: 11,
        color: COLORS.gray[500],
        fontStyle: 'italic',
    },
    arrow: {
        paddingLeft: 8,
    },
    arrowText: {
        fontSize: 20,
        color: COLORS.gray[400],
        fontWeight: '300',
    },
});