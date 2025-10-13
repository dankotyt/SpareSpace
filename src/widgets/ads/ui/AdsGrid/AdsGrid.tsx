import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface AdItem {
    id: string;
    price: string;
    type: string;
    location: string;
    image?: string;
}

interface AdsGridProps {
    ads: AdItem[];
}

export const AdsGrid: React.FC<AdsGridProps> = ({ ads }) => {
    return (
        <View style={styles.container}>
            {ads.map((item) => (
                <View key={item.id} style={styles.adItem}>
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.imageText}>📷</Text>
                    </View>
                    <Text style={styles.price}>{item.price}</Text>
                    <Text style={styles.type}>{item.type}</Text>
                    <Text style={styles.location}>{item.location}</Text>
                </View>
            ))}
        </View>
    );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    adItem: {
        width: itemWidth,
        marginBottom: 16,
    },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    imageText: {
        fontSize: 24,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#202020',
        marginBottom: 4,
    },
    type: {
        fontSize: 14,
        fontWeight: '500',
        color: '#202020',
        marginBottom: 2,
    },
    location: {
        fontSize: 14,
        color: '#6B7280',
    },
});