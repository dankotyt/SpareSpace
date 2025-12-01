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
                const data = await listingApiService.getListingById(listingId);
                setListing(data);
            } catch (err: any) {
                setError(err.message);
                console.error('❌ Error loading listing:', err);
            } finally {
                setLoading(false);
            }
        };

        if (listingId) {
            loadListing();
        }
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

    const firstPhoto = listing.photosJson?.[0] ||
        (typeof listing.photos === 'string'
            ? JSON.parse(listing.photos)?.[0]
            : null);

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
                {firstPhoto && (
                    <Image
                        source={{ uri: firstPhoto }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                {/* Информация */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={2}>
                        {listing.title}
                    </Text>
                    {listing.address && (
                        <Text style={styles.description} numberOfLines={1}>
                            {listing.address}
                        </Text>
                    )}
                    <Text style={styles.price}>
                        {formatPrice(listing.price, listing.pricePeriod)}
                    </Text>
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
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
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
    description: {
        fontSize: 12,
        color: COLORS.gray[600],
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
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