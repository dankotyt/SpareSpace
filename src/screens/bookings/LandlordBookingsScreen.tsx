import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Booking, bookingsApiService } from '@/services/api/bookingsApi';
import { formatPriceWithCurrency } from '@shared/utils/listingFormatter';
import { getLandlordBookings } from '@/shared/utils/bookingUtils';
import { useAuth } from '@hooks/auth/useAuth';

type LandlordBookingsScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'LandlordBookings'
>;

export const LandlordBookingsScreen: React.FC = () => {
    const navigation = useNavigation<LandlordBookingsScreenNavigationProp>();
    const { user } = useAuth();
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

    // Фильтруем бронирования арендодателя
    const landlordBookings = getLandlordBookings(allBookings, user?.id || 0);

    // Фильтруем по активному табу
    const filteredBookings = landlordBookings.filter(booking => {
        if (activeTab === 'all') return true;
        return booking.status === activeTab.toUpperCase();
    });

    const loadBookings = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await bookingsApiService.findAll({
                limit: 50,
                offset: 0,
            });

            setAllBookings(response.bookings);
        } catch (error) {
            console.error('❌ Error loading bookings:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить заявки на бронирование');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadBookings();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const handleBookingPress = (booking: Booking) => {
        navigation.navigate('BookingDetails', { bookingId: booking.id });
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

                            loadBookings();
                        } catch (error: any) {
                            console.error(`❌ Error ${action}ing booking:`, error);
                            Alert.alert('Ошибка', error.message || `Не удалось ${actionText} бронирование`);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return COLORS.orange[500];
            case 'CONFIRMED': return COLORS.green[500];
            case 'CANCELLED': return COLORS.red[500];
            case 'COMPLETED': return COLORS.gray[500];
            default: return COLORS.gray[500];
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Ожидает подтверждения';
            case 'CONFIRMED': return 'Подтверждено';
            case 'CANCELLED': return 'Отменено';
            case 'COMPLETED': return 'Завершено';
            default: return status;
        }
    };

    const tabs = [
        { key: 'all' as const, label: 'Все' },
        { key: 'pending' as const, label: 'Ожидание' },
        { key: 'confirmed' as const, label: 'Подтверждено' },
        { key: 'cancelled' as const, label: 'Отменено' },
        { key: 'completed' as const, label: 'Завершено' },
    ];

    const renderBookingCard = (booking: Booking) => (
        <View key={booking.id} style={styles.bookingCard}>
            <TouchableOpacity
                onPress={() => handleBookingPress(booking)}
                style={styles.bookingContent}
            >
                {booking.firstListingPhoto && (
                    <Image
                        source={{ uri: booking.firstListingPhoto }}
                        style={styles.listingImage}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.bookingInfo}>
                    <View style={styles.bookingHeader}>
                        <View style={styles.statusContainer}>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(booking.status) }
                            ]} />
                            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                        </View>
                        <Text style={styles.bookingId}>#{booking.id}</Text>
                    </View>

                    <Text style={styles.listingTitle} numberOfLines={2}>
                        {booking.listingTitle || `Объект #${booking.id}`}
                    </Text>

                    <View style={styles.renterInfo}>
                        <TouchableOpacity
                            style={styles.renterTouchable}
                            onPress={() => {
                                const isRenterCurrentUser = booking.renter?.id === user?.id;
                                navigation.navigate('Profile', {
                                    userId: isRenterCurrentUser ? undefined : booking.renter?.id
                                });
                            }}
                        >
                            <Ionicons name="person-outline" size={14} color={COLORS.gray[500]} />
                            <Text style={styles.renterText}>
                                {booking.renter?.firstName} {booking.renter?.lastName}
                            </Text>
                            {booking.renter?.id === user?.id && (
                                <Text style={styles.youBadge}>(Вы)</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.price}>
                        {formatPriceWithCurrency(booking.totalPrice, booking.currency)}
                    </Text>

                    <Text style={styles.createdAt}>
                        Заявка от {new Date(booking.createdAt).toLocaleDateString('ru-RU')}
                    </Text>
                </View>
            </TouchableOpacity>

            {booking.status === 'PENDING' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleBookingAction(booking, 'reject')}
                    >
                        <Ionicons name="close-circle-outline" size={18} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Отклонить</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => handleBookingAction(booking, 'confirm')}
                    >
                        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Подтвердить</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка заявок...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Заявки на бронирование</Text>
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {filteredBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={COLORS.gray[400]} />
                        <Text style={styles.emptyStateTitle}>
                            {activeTab === 'all'
                                ? 'Нет заявок на бронирование'
                                : `Нет заявок со статусом "${tabs.find(t => t.key === activeTab)?.label}"`}
                        </Text>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'all'
                                ? 'На ваши объекты еще не поступали заявки на бронирование'
                                : 'Попробуйте выбрать другой статус'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.bookingsList}>
                        {filteredBookings.map(renderBookingCard)}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
        marginTop: 50,
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    tabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        color: COLORS.gray[600],
        fontWeight: '500',
    },
    activeTabText: {
        color: COLORS.white,
    },
    content: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.gray[500],
    },
    emptyState: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 16,
        textAlign: 'center',
    },
    emptyStateText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.gray[500],
        textAlign: 'center',
        lineHeight: 20,
    },
    bookingsList: {
        padding: 16,
    },
    bookingCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        marginBottom: 16,
        overflow: 'hidden',
    },
    bookingContent: {
        padding: 16,
    },
    listingImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 12,
    },
    bookingInfo: {
        flex: 1,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: COLORS.gray[700],
        fontWeight: '500',
    },
    bookingId: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    listingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        lineHeight: 20,
    },
    renterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
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
    renterText: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginLeft: 4,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.green[500],
        marginBottom: 8,
    },
    createdAt: {
        fontSize: 12,
        color: COLORS.gray[400],
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
        paddingVertical: 12,
        gap: 6,
    },
    confirmButton: {
        backgroundColor: COLORS.green[500],
    },
    rejectButton: {
        backgroundColor: COLORS.red[500],
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
    },
});