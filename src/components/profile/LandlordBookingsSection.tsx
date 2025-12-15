import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStats } from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';
import { Booking, bookingsApiService } from '@/services/api/bookingsApi';
import { formatPriceWithCurrency } from "@shared/utils/listingFormatter";
import {
    getLandlordBookings,
    getPendingLandlordBookingsCount
} from '@/shared/utils/bookingUtils';
import {useNavigation} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "@navigation/types";
import {useAuth} from "@hooks/auth/useAuth";

interface LandlordBookingsSectionProps {
    userId: number;
    stats: UserStats;
    onAllBookingsPress: () => void;
    onBookingPress: (booking: Booking) => void;
    onPendingBookingsPress?: () => void;
}

export const LandlordBookingsSection: React.FC<LandlordBookingsSectionProps> = ({
                                                                                    userId,
                                                                                    stats,
                                                                                    onAllBookingsPress,
                                                                                    onBookingPress,
                                                                                    onPendingBookingsPress
                                                                                }) => {
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user: currentUser } = useAuth();

    // Фильтруем бронирования арендодателя на фронтенде
    const landlordBookings = getLandlordBookings(allBookings, userId);
    const pendingCount = getPendingLandlordBookingsCount(allBookings, userId);

    useEffect(() => {
        if (!userId || isNaN(userId)) {
            setError('Неверный ID пользователя');
            setLoading(false);
            return;
        }

        loadAllBookings();
    }, [userId]);

    const loadAllBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            // Загружаем все бронирования пользователя
            const response = await bookingsApiService.findAll({
                limit: 50,
                offset: 0
            });

            setAllBookings(response.bookings || []);

        } catch (err: any) {
            console.error('❌ Error loading bookings:', err);
            setError(err.message || 'Не удалось загрузить бронирования');
            setAllBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const navigateToProfile = (profileUserId: number) => {
        const isOwnProfile = profileUserId === currentUser?.id;
        navigation.navigate('Profile', {
            userId: isOwnProfile ? undefined : profileUserId
        });
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

    const handleBookingAction = async (booking: Booking, action: 'confirm' | 'reject') => {
        const actionText = action === 'confirm' ? 'подтвердить' : 'отклонить';

        Alert.alert(
            `${action === 'confirm' ? 'Подтвердить' : 'Отклонить'} бронирование`,
            `Вы уверены, что хотите ${actionText} бронирование #${booking.id}?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: action === 'confirm' ? 'Подтвердить' : 'Отклонить',
                    onPress: async () => {
                        try {
                            const newStatus = action === 'confirm' ? 'CONFIRMED' : 'CANCELLED';
                            await bookingsApiService.changeStatus(booking.id, newStatus);

                            Alert.alert(
                                'Успех',
                                `Бронирование ${action === 'confirm' ? 'подтверждено' : 'отклонено'}!`
                            );

                            loadAllBookings();
                        } catch (error: any) {
                            console.error(`❌ Error ${action}ing booking:`, error);
                            Alert.alert('Ошибка', error.message || `Не удалось ${actionText} бронирование`);
                        }
                    },
                },
            ]
        );
    };

    const renderBookingItems = () => {
        if (landlordBookings.length === 0) {
            return (
                <View style={styles.emptyItem}>
                    <Ionicons name="calendar-outline" size={32} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>Нет бронирований</Text>
                    <Text style={styles.emptySubtitle}>Ваши объекты еще не бронировали</Text>
                </View>
            );
        }

        return landlordBookings.slice(0, 3).map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
                <TouchableOpacity
                    style={styles.bookingContent}
                    onPress={() => onBookingPress(booking)}
                >
                    <View style={styles.bookingIcon}>
                        <Ionicons
                            name={getBookingIcon(booking.status) as any}
                            size={20}
                            color={getStatusColor(booking.status)}
                        />
                    </View>

                    <View style={styles.bookingInfo}>
                        <Text style={styles.bookingTitle} numberOfLines={2}>
                            {booking.listingTitle || `Объект #${booking.id}`}
                        </Text>

                        <View style={styles.bookingDetails}>
                            <TouchableOpacity
                                style={styles.renterTouchable}
                                onPress={() => {
                                    if (booking.renter?.id) {
                                        navigateToProfile(booking.renter.id);
                                    }
                                }}
                            >
                                <Text style={styles.bookingRenter}>
                                    {booking.renter?.firstName} {booking.renter?.lastName}
                                </Text>
                                {booking.renter?.id === userId && (
                                    <Text style={styles.youBadge}>(Вы)</Text>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.bookingPrice}>
                                {formatPriceWithCurrency(booking.totalPrice, booking.currency)}
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
                    </View>
                </TouchableOpacity>

                {booking.status === 'PENDING' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleBookingAction(booking, 'reject')}
                        >
                            <Text style={styles.actionButtonText}>Отклонить</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.confirmButton]}
                            onPress={() => handleBookingAction(booking, 'confirm')}
                        >
                            <Text style={styles.actionButtonText}>Подтвердить</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        ));
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.header} onPress={onAllBookingsPress}>
                    <Text style={styles.sectionTitle}>Бронирования моих объектов</Text>
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
                    <Text style={styles.sectionTitle}>Бронирования моих объектов</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
                </TouchableOpacity>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadAllBookings} style={styles.retryButton}>
                        <Text style={styles.retryText}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={onAllBookingsPress}>
                <View style={styles.headerLeft}>
                    <Text style={styles.sectionTitle}>Бронирования моих объектов</Text>
                    {pendingCount > 0 && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>{pendingCount}</Text>
                        </View>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
            </TouchableOpacity>

            {pendingCount > 0 && onPendingBookingsPress && (
                <TouchableOpacity style={styles.pendingAlert} onPress={onPendingBookingsPress}>
                    <Ionicons name="notifications" size={16} color={COLORS.orange[500]} />
                    <Text style={styles.pendingAlertText}>
                        {pendingCount} ожидает подтверждения
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.orange[500]} />
                </TouchableOpacity>
            )}

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
    pendingBadge: {
        backgroundColor: COLORS.orange[500],
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    pendingText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
    },
    pendingAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.orange[100],
        borderWidth: 1,
        borderColor: COLORS.orange[200],
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        gap: 8,
    },
    pendingAlertText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.orange[500],
        fontWeight: '500',
    },
    scrollContent: {
        gap: 12,
    },
    bookingItem: {
        width: 180,
        backgroundColor: COLORS.gray[100],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        overflow: 'hidden',
    },
    bookingContent: {
        padding: 12,
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
    bookingInfo: {
        flex: 1,
    },
    bookingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
        lineHeight: 18,
    },
    bookingDetails: {
        marginBottom: 8,
    },
    bookingRenter: {
        fontSize: 12,
        color: COLORS.gray[600],
        marginBottom: 4,
    },
    bookingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.green[500],
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.white,
    },
    actionButtons: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 4,
    },
    confirmButton: {
        backgroundColor: COLORS.green[500],
    },
    rejectButton: {
        backgroundColor: COLORS.red[500],
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
    },
    emptyItem: {
        width: 160,
        backgroundColor: COLORS.gray[100],
        padding: 16,
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
    emptySubtitle: {
        fontSize: 12,
        color: COLORS.gray[400],
        textAlign: 'center',
        marginTop: 4,
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
    renterTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    youBadge: {
        fontSize: 12,
        color: COLORS.gray[500],
        fontStyle: 'italic',
        marginLeft: 4,
    },
});