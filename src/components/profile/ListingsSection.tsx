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
            case 'parking':
                return 'car';
            case 'garage':
                return 'home';
            case 'pantry':
                return 'archive';
            default:
                return 'business';
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={onAllAdsPress}>
                <Text style={styles.sectionTitle}>Мои объявления</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
            </TouchableOpacity>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {listings.map((asset) => (
                    <TouchableOpacity
                        key={asset.id}
                        style={styles.assetItem}
                        onPress={() => onAssetPress(asset)}
                    >
                        <View style={styles.assetIcon}>
                            <Ionicons
                                name={getAssetIcon(asset.type) as keyof typeof Ionicons.glyphMap}
                                size={20}
                                color={COLORS.primary}
                            />
                        </View>
                        <Text style={styles.assetTitle}>{asset.title}</Text>
                        <Text style={styles.assetAddress}>{asset.address}</Text>
                    </TouchableOpacity>
                ))}
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
    scrollContent: {
        gap: 12,
    },
    assetItem: {
        width: 140,
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    assetIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    assetTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    assetAddress: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
});