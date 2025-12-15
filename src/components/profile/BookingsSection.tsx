import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStats } from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';
import {Booking, bookingsApiService} from '@/services/api/bookingsApi';
import {formatPriceWithCurrency} from "@shared/utils/listingFormatter";
import {getRenterBookings} from "@shared/utils/bookingUtils";

interface BookingsSectionProps {
    userId: number;
    stats: UserStats;
    onAllBookingsPress: () => void;
    onBookingPress: (booking: Booking) => void;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({
                                                                    userId,
                                                                    stats,
                                                                    onAllBookingsPress,
                                                                    onBookingPress
                                                                }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const renterBookings = getRenterBookings(bookings, userId);

    useEffect(() => {
        if (!userId || isNaN(userId)) {
            setError('Неверный ID пользователя');
            setLoading(false);
            return;
        }

        loadBookings();
    }, [userId]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingsApiService.findAll({
                limit: 50,
                offset: 0
            });

            setBookings(response.bookings || []);
        } catch (err: any) {
            console.error('❌ Error loading bookings:', err);
            setError(err.message || 'Не удалось загрузить бронирования');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await bookingsApiService.findAll({
                limit: 3,
                offset: 0
            });

            setBookings(response.bookings);

        } catch (err: any) {
            console.error('❌ Error loading recent bookings:', err);

            let errorMessage = 'Не удалось загрузить бронирования';
            if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.header} onPress={onAllBookingsPress}>
                    <Text style={styles.sectionTitle}>Мои бронирования</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
                </TouchableOpacity>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Загрузка...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.header} onPress={onAllBookingsPress}>
                    <Text style={styles.sectionTitle}>Мои бронирования</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
                </TouchableOpacity>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadRecentBookings} style={styles.retryButton}>
                        <Text style={styles.retryText}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderBookingItems = () => {
        if (renterBookings.length === 0) {
            return (
                <View style={styles.emptyItem}>
                    <Ionicons name="calendar-outline" size={32} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>Нет бронирований</Text>
                </View>
            );
        }

        return bookings.map((booking) => {
            const safeTotalPrice = booking.totalPrice || 0;
            const safeStatus = booking.status || 'PENDING';
            const safeId = booking.id || 0;

            return (
                <TouchableOpacity
                    key={safeId}
                    style={styles.bookingItem}
                    onPress={() => onBookingPress(booking)}
                >
                    <View style={styles.bookingIcon}>
                        <Ionicons
                            name={getBookingIcon(safeStatus) as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color={getStatusColor(safeStatus)}
                        />
                    </View>
                    <Text style={styles.bookingTitle}>
                        Бронирование #{safeId}
                    </Text>
                    <Text style={styles.bookingPrice}>
                        {formatPriceWithCurrency(safeTotalPrice, '₽')}
                    </Text>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(safeStatus) }
                    ]}>
                        <Text style={styles.statusText}>
                            {getStatusText(safeStatus)}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        });
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
                {renderBookingItems()}
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    counterBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    counterText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
    },
    scrollContent: {
        gap: 12,
    },
    bookingItem: {
        width: 160,
        height: 120,
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    bookingIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    bookingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    bookingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.green[500],
    },
    emptyItem: {
        width: 140,
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 140,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray[500],
        textAlign: 'center',
        marginTop: 8,
    },
    loadingContainer: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.gray[100],
        borderRadius: 12,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.gray[500],
    },
    errorContainer: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.red[50],
        borderRadius: 12,
        padding: 16,
    },
    errorText: {
        fontSize: 14,
        color: COLORS.red[500],
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.red[500],
        borderRadius: 8,
    },
    retryText: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: '600',
    },
});