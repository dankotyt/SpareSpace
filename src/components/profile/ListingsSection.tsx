import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';

interface ListingsSectionProps {
    listings: Listing[];
    onAllAdsPress: () => void;
    onAssetPress: (asset: Listing) => void;
}

export const ListingsSection: React.FC<ListingsSectionProps> = ({
                                                                    listings,
                                                                    onAllAdsPress,
                                                                    onAssetPress
                                                                }) => {
    const getAssetIcon = (type: string) => {
        switch (type) {
            case 'PARKING': return 'car';
            case 'GARAGE': return 'home';
            case 'STORAGE': return 'archive';
            default: return 'business';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return COLORS.green[500];
            case 'DRAFT': return COLORS.orange[500];
            default: return COLORS.gray[500];
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={onAllAdsPress}>
                <View>
                    <Text style={styles.sectionTitle}>Мои объявления</Text>
                    <Text style={styles.subtitle}>
                        {listings.length} объявлений
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
            </TouchableOpacity>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {listings.length === 0 ? (
                    <View style={styles.emptyItem}>
                        <View style={styles.assetIcon}>
                            <Ionicons
                                name="business-outline"
                                size={20}
                                color={COLORS.gray[400]}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>Нет объявлений</Text>
                    </View>
                ) : (
                    listings.map((listing) => (
                        <TouchableOpacity
                            key={listing.id}
                            style={styles.assetItem}
                            onPress={() => onAssetPress(listing)}
                        >
                            <View style={styles.assetHeader}>
                                <View style={styles.assetIcon}>
                                    <Ionicons
                                        name={getAssetIcon(listing.type) as any}
                                        size={20}
                                        color={COLORS.primary}
                                    />
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(listing.status) }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {listing.status === 'ACTIVE' ? 'Активно' : 'Черновик'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.assetTitle}>{listing.title}</Text>
                            <Text style={styles.assetPrice}>
                                {listing.price} ₽
                                {listing.pricePeriod === 'HOUR' && '/час'}
                                {listing.pricePeriod === 'DAY' && '/день'}
                                {listing.pricePeriod === 'WEEK' && '/неделя'}
                                {listing.pricePeriod === 'MONTH' && '/месяц'}
                            </Text>
                            <Text style={styles.assetAddress}>{listing.address}</Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        padding: 16,
        marginTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginTop: 2,
    },
    scrollContent: {
        gap: 12,
    },
    assetItem: {
        width: 160,
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    assetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    assetIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        color: COLORS.white,
        fontWeight: '600',
    },
    assetTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    assetPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    assetAddress: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    emptyItem: {
        width: 160,
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray[500],
        textAlign: 'center',
    },
});