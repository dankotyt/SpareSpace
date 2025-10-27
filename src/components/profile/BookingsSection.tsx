import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Booking, UserStats } from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';

interface BookingsSectionProps {
    bookings: Booking[];
    stats: UserStats;
    onAllBookingsPress: () => void;
    onBookingPress: (booking: Booking) => void;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({
                                                                    bookings,
                                                                    stats,
                                                                    onAllBookingsPress,
                                                                    onBookingPress
                                                                }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return COLORS.green[500];
            case 'pending': return COLORS.orange[500];
            case 'cancelled': return COLORS.red[500];
            case 'completed': return COLORS.gray[500];
            default: return COLORS.gray[500];
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Подтверждено';
            case 'pending': return 'Ожидание';
            case 'cancelled': return 'Отменено';
            case 'completed': return 'Завершено';
            default: return status;
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={onAllBookingsPress}>
                <Text style={styles.sectionTitle}>Мои бронирования</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.count}>{stats.totalBookings}</Text>
                    <Text style={styles.arrow}>›</Text>
                </View>
            </TouchableOpacity>

            {bookings.length === 0 ? (
                <Text style={styles.emptyText}>Бронирований пока нет</Text>
            ) : (
                bookings.slice(0, 3).map(booking => (
                    <TouchableOpacity
                        key={booking.id}
                        style={styles.bookingItem}
                        onPress={() => onBookingPress(booking)}
                    >
                        <View style={styles.bookingInfo}>
                            <Text style={styles.bookingTitle}>
                                Бронирование #{booking.id}
                            </Text>
                            <Text style={styles.bookingPrice}>
                                {booking.total_price} ₽
                            </Text>
                        </View>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(booking.status) }
                        ]}>
                            <Text style={styles.statusText}>
                                {getStatusText(booking.status)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        padding: 16,
        marginTop: 8,
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    count: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginRight: 8,
    },
    arrow: {
        fontSize: 18,
        color: COLORS.gray[500],
    },
    bookingItem: {
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookingInfo: {
        flex: 1,
    },
    bookingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    bookingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.green[500],
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.gray[500],
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
});