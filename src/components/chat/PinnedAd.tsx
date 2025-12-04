import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {COLORS} from '@/shared/constants/colors';
import {formatPriceWithCurrency} from "@shared/utils/listingFormatter";

interface PinnedAdProps {
    listingData: any;
    onPress?: (listingId: number) => void;
}

export const PinnedAd: React.FC<PinnedAdProps> = ({ listingData, onPress }) => {

    if (!listingData) {
        return null;
    }

    const getPeriodText = (period?: string) => {
        return {
            'HOUR': 'час',
            'DAY': 'день',
            'WEEK': 'неделя',
            'MONTH': 'месяц'
        }[period || 'DAY'] || 'день';
    };

    const getFirstPhoto = () => {
        if (!listingData) return null;

        const possibleSources = [
            listingData.firstPhotoUrl,
            ...(Array.isArray(listingData.photoUrls) ? listingData.photoUrls : []),
            ...(Array.isArray(listingData.photosJson) ? listingData.photosJson : []),
            ...(Array.isArray(listingData.photos) ? listingData.photos : []),
            ...(Array.isArray(listingData.images) ? listingData.images : []),
        ];

        const validPhoto = possibleSources.find(source =>
            source && typeof source === 'string' && source.trim() !== ''
        );

        return validPhoto || null;
    };

    const firstPhoto = getFirstPhoto();

    const getListingType = () => {
        switch (listingData.type) {
            case 'PARKING': return 'Парковочное место';
            case 'GARAGE': return 'Гараж';
            case 'STORAGE': return 'Кладовая';
            default: return 'Объявление';
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(listingData.id)}
            activeOpacity={0.7}
        >
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
                        {listingData.title || `${getListingType()} - ${listingData.address || 'Без адреса'}`}
                    </Text>

                    {listingData.address && (
                        <Text style={styles.address} numberOfLines={1}>
                            📍 {listingData.address}
                        </Text>
                    )}

                    <Text style={styles.price}>
                        {formatPriceWithCurrency(listingData.price || 0, '₽')}/{getPeriodText(listingData.pricePeriod)}
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