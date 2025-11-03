import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            case 'CONFIRMED': return COLORS.green[500];
            case 'PENDING': return COLORS.orange[500];
            case 'CANCELLED': return COLORS.red[500];
            case 'COMPLETED': return COLORS.gray[500];
            default: return COLORS.gray[500];
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'Подтверждено';
            case 'PENDING': return 'Ожидание';
            case 'CANCELLED': return 'Отменено';
            case 'COMPLETED': return 'Завершено';
            default: return status;
        }
    };

    const getBookingIcon = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'checkmark-circle';
            case 'PENDING': return 'time';
            case 'CANCELLED': return 'close-circle';
            case 'COMPLETED': return 'checkmark-done';
            default: return 'calendar';
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={onAllBookingsPress}>
                <Text style={styles.sectionTitle}>Мои бронирования</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
            </TouchableOpacity>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {bookings.length === 0 ? (
                    <View style={styles.emptyItem}>
                        <View style={styles.bookingIcon}>
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={COLORS.gray[400]}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>Нет бронирований</Text>
                    </View>
                ) : (
                    bookings.map((booking) => (
                        <TouchableOpacity
                            key={booking.id}
                            style={styles.bookingItem}
                            onPress={() => onBookingPress(booking)}
                        >
                            <View style={styles.bookingIcon}>
                                <Ionicons
                                    name={getBookingIcon(booking.status) as keyof typeof Ionicons.glyphMap}
                                    size={20}
                                    color={getStatusColor(booking.status)}
                                />
                            </View>
                            <Text style={styles.bookingTitle}>
                                Бронирование #{booking.id}
                            </Text>
                            <Text style={styles.bookingPrice}>
                                {booking.totalPrice} ₽
                            </Text>
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
    bookingItem: {
        width: 140,
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    bookingIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
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
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.white,
    },
    emptyItem: {
        width: 140,
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