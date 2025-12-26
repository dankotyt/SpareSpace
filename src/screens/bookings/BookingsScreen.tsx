import React, {useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert, ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { bookingsService, Booking } from '@services/bookingsService';
import {useAuth} from "@hooks/auth/useAuth";
import {bookingsApiService} from "@services/api/bookingsApi";
import {useFocusEffect} from "@react-navigation/core";
import {formatPriceWithCurrency} from "@shared/utils/listingFormatter";

export const BookingsScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

    const loadBookings = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const status = activeTab === 'all' ? undefined : activeTab.toUpperCase();
            const response = await bookingsApiService.findAll({
                limit: 50,
                offset: 0,
                status
            });

            setBookings(response.bookings);
        } catch (error) {
            console.error('❌ Error loading bookings:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить бронирования');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, activeTab]);

    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [loadBookings])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const handleCancelBooking = async (bookingId: number) => {
        Alert.alert(
            'Отменить бронирование',
            'Вы уверены, что хотите отменить это бронирование?',
            [
                { text: 'Нет', style: 'cancel' },
                {
                    text: 'Да',
                    onPress: async () => {
                        try {
                            await bookingsApiService.remove(bookingId);
                            loadBookings();
                            Alert.alert('Успех', 'Бронирование отменено');
                        } catch (error: any) {
                            console.error('❌ Error canceling booking:', error);
                            Alert.alert('Ошибка', error.message || 'Не удалось отменить бронирование');
                        }
                    },
                },
            ]
        );
    };

    const navigateToProfileFromList = (userId: number, isViewingOwnProfile: boolean = false) => {
        navigation.navigate('Profile', {
            userId: isViewingOwnProfile ? undefined : userId
        });
    };

    const handleBookingPress = (booking: Booking) => {
        navigation.navigate('BookingDetails', { bookingId: booking.id });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return COLORS.orange[400];
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

    const filterBookings = () => {
        if (activeTab === 'all') {
            return bookings;
        } else if (activeTab === 'cancelled') {
            return bookings.filter(booking => booking.status === 'CANCELLED');
        } else {
            return bookings.filter(booking => booking.status === activeTab.toUpperCase());
        }
    };

    const tabs = [
        { key: 'all' as const, label: 'Все' },
        { key: 'pending' as const, label: 'Ожидание' },
        { key: 'confirmed' as const, label: 'Подтверждено' },
        { key: 'completed' as const, label: 'Завершено' },
        { key: 'cancelled' as const, label: 'Отменено' },
    ];

    const filteredBookings = filterBookings();

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Загрузка...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Мои бронирования</Text>
            </View>

            {/* Горизонтальные свайпаемые вкладки */}
            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {tabs.map((tab, index) => (
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
                {loading && !refreshing ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Загрузка...</Text>
                    </View>
                ) : filteredBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={COLORS.gray[400]} />
                        <Text style={styles.emptyStateTitle}>Бронирований нет</Text>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'all'
                                ? 'У вас пока нет бронирований'
                                : `Нет бронирований со статусом "${tabs.find(t => t.key === activeTab)?.label}"`}
                        </Text>
                    </View>
                ) : (
                    filteredBookings.map((booking) => (
                        <TouchableOpacity
                            key={booking.id}
                            style={styles.bookingCard}
                            onPress={() => handleBookingPress(booking)}
                        >
                            {/* Изображение слева */}
                            {booking.firstListingPhoto ? (
                                <Image
                                    source={{ uri: booking.firstListingPhoto }}
                                    style={styles.listingImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.listingImage, styles.noImage]}>
                                    <Ionicons name="image-outline" size={32} color={COLORS.gray[400]} />
                                </View>
                            )}

                            {/* Контент справа */}
                            <View style={styles.listingContent}>
                                {/* Статус и кнопка отмены */}
                                <View style={styles.bookingHeader}>
                                    <View style={styles.statusContainer}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                                        <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                                    </View>
                                    {booking.status === 'PENDING' && (
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => handleCancelBooking(booking.id)}
                                        >
                                            <Ionicons name="close-circle-outline" size={20} color={COLORS.red[500]} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Название */}
                                <Text style={styles.listingTitle} numberOfLines={2}>
                                    {booking.listingTitle || `Бронирование #${booking.id}`}
                                </Text>

                                {/* Участники */}
                                <View style={styles.participantsContainer}>
                                    <TouchableOpacity
                                        style={styles.participantRow}
                                        onPress={() => navigateToProfileFromList(booking.landlord?.id || 0)}
                                    >
                                        <Text style={styles.participantLabel}>Владелец:</Text>
                                        <View style={styles.participantInfo}>
                                            <Text style={styles.participantName} numberOfLines={1}>
                                                {booking.landlord?.firstName} {booking.landlord?.lastName}
                                            </Text>
                                            {booking.landlord?.id === user?.id && (
                                                <Text style={styles.youBadge}>(Вы)</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.participantRow}
                                        onPress={() => navigateToProfileFromList(booking.renter?.id || 0)}
                                    >
                                        <Text style={styles.participantLabel}>Арендатор:</Text>
                                        <View style={styles.participantInfo}>
                                            <Text style={styles.participantName} numberOfLines={1}>
                                                {booking.renter?.firstName} {booking.renter?.lastName}
                                            </Text>
                                            {booking.renter?.id === user?.id && (
                                                <Text style={styles.youBadge}>(Вы)</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Цена и дата */}
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceLabel}>Сумма:</Text>
                                    <Text style={styles.priceValue}>
                                        {formatPriceWithCurrency(booking.totalPrice || 0, booking.currency || '₽')}
                                    </Text>
                                </View>

                                {/* Дата создания */}
                                <View style={styles.createdAt}>
                                    <Text style={styles.createdAtText}>
                                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('ru-RU') : ''}
                                    </Text>
                                </View>
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
        position: 'relative',
    },
    tabsContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
        marginVertical: 4,
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
        paddingVertical: 48,
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
    },
    emptyStateText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.gray[500],
        textAlign: 'center',
        lineHeight: 20,
    },
    bookingCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        minHeight: 100,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        flex: 1,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.gray[700],
        flex: 1,
    },
    cancelButton: {
        padding: 4,
    },
    listingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
        flexShrink: 1,
    },
    listingAddress: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginBottom: 12,
    },
    datesContainer: {
        marginBottom: 12,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    dateLabel: {
        fontSize: 12,
        color: COLORS.gray[600],
        marginLeft: 8,
        marginRight: 4,
    },
    dateValue: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.text,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.gray[600],
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    createdAt: {
        marginTop: 12,
    },
    createdAtText: {
        fontSize: 12,
        color: COLORS.gray[400],
        textAlign: 'right',
    },
    listingImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    listingContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    participantsContainer: {
        marginBottom: 8,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap: 4,
    },
    youBadge: {
        fontSize: 10,
        color: COLORS.gray[500],
        fontStyle: 'italic',
        flexShrink: 0,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    participantLabel: {
        fontSize: 11,
        color: COLORS.gray[500],
        marginRight: 4,
    },
    participantName: {
        fontSize: 11,
        color: COLORS.gray[700],
        flexShrink: 1,
    },
    noImage: {
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray[200],
    },
});