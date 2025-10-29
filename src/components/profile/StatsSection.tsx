import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserStats } from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';

interface StatsSectionProps {
    stats: UserStats;
    onPress: () => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalListings}</Text>
                    <Text style={styles.statLabel}>Объявления</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.activeListings}</Text>
                    <Text style={styles.statLabel}>Активные</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalBookings}</Text>
                    <Text style={styles.statLabel}>Бронирования</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalReviews}</Text>
                    <Text style={styles.statLabel}>Отзывы</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.gray[500],
        textAlign: 'center',
    },
});