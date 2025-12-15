import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import {bookingsApiService, Booking, BookingWithPeriod} from '@/services/api/bookingsApi';
import {formatPriceWithCurrency} from "@shared/utils/listingFormatter";
import {useAuth} from "@hooks/auth/useAuth";

type BookingDetailsScreenRouteProp = RouteProp<RootStackParamList, 'BookingDetails'>;
type BookingDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingDetails'>;

export const BookingDetailsScreen: React.FC = () => {
    const route = useRoute<BookingDetailsScreenRouteProp>();
    const navigation = useNavigation<BookingDetailsScreenNavigationProp>();
    const { bookingId } = route.params;
    const { user: currentUser } = useAuth();
    const [booking, setBooking] = useState<BookingWithPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    // Проверяем, является ли текущий пользователь арендодателем
    const isLandlord = booking?.landlord?.id === currentUser?.id;
    const isRenter = booking?.renter?.id === currentUser?.id;


    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    const parseBookingPeriod = (periodString: any) => {
        // Если periodString - уже объект с полями start и end
        if (periodString && typeof periodString === 'object') {
            try {
                const start = new Date(periodString.start);
                const end = new Date(periodString.end);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    console.log('❌ Invalid dates in period object');
                    return { start: null, end: null, durationDays: 0 };
                }

                const durationMs = end.getTime() - start.getTime();
                const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

                console.log('✅ Parsed period from object:', {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    durationDays
                });

                return {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    durationDays,
                    // Добавляем время
                    startTime: start.toTimeString().split(' ')[0].slice(0, 5), // HH:MM
                    endTime: end.toTimeString().split(' ')[0].slice(0, 5) // HH:MM
                };
            } catch (error) {
                console.error('❌ Error parsing period object:', error);
                return { start: null, end: null, durationDays: 0 };
            }
        }

        // Если periodString - строка, используем существующую логику
        if (!periodString || typeof periodString !== 'string') {
            console.log('📦 periodString is not a string:', periodString);
            return { start: null, end: null, durationDays: 0 };
        }

        try {
            console.log('📦 Parsing period string:', periodString);

            // Формат tstzrange: "[2024-01-01 00:00:00+03,2024-01-10 00:00:00+03)"
            const cleanedString = periodString.trim();
            let startStr = '';
            let endStr = '';

            const match = cleanedString.match(/\[(.*?),(.*?)\)/);
            if (match) {
                startStr = match[1].replace(/"/g, '').trim();
                endStr = match[2].replace(/"/g, '').trim();
            }

            if (!startStr || !endStr) {
                console.log('❌ Could not parse period string');
                return { start: null, end: null, durationDays: 0 };
            }

            const start = new Date(startStr);
            const end = new Date(endStr);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.log('❌ Invalid dates after parsing');
                return { start: null, end: null, durationDays: 0 };
            }

            const durationMs = end.getTime() - start.getTime();
            const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

            console.log('✅ Parsed period:', {
                start: start.toISOString(),
                end: end.toISOString(),
                durationDays
            });

            return {
                start: start.toISOString(),
                end: end.toISOString(),
                durationDays,
                // Добавляем время для строкового формата
                startTime: start.toTimeString().split(' ')[0].slice(0, 5), // HH:MM
                endTime: end.toTimeString().split(' ')[0].slice(0, 5) // HH:MM
            };
        } catch (error) {
            console.error('❌ Error parsing period:', error);
            return { start: null, end: null, durationDays: 0 };
        }
    };

    const loadBookingDetails = async () => {
        try {
            const bookingData = await bookingsApiService.findOne(bookingId);

            let bookingWithPeriod: BookingWithPeriod = bookingData;

            // Если bookingData содержит поле period
            if (bookingData.period) {
                const parsedPeriod = parseBookingPeriod(bookingData.period);

                bookingWithPeriod = {
                    ...bookingData,
                    periodStart: parsedPeriod.start || undefined,
                    periodEnd: parsedPeriod.end || undefined,
                    periodStartTime: parsedPeriod.startTime || undefined,
                    periodEndTime: parsedPeriod.endTime || undefined,
                    durationDays: parsedPeriod.durationDays || undefined
                };
            }

            setBooking(bookingWithPeriod);

        } catch (error) {
            console.error('❌ Error loading booking details:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить детали бронирования');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!booking) return;

        Alert.alert(
            'Подтвердить бронирование',
            'Вы уверены, что хотите подтвердить это бронирование?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Подтвердить',
                    onPress: async () => {
                        try {
                            await bookingsApiService.changeStatus(booking.id, 'CONFIRMED');
                            Alert.alert('Успех', 'Бронирование подтверждено!');
                            // Перезагружаем данные
                            loadBookingDetails();
                        } catch (error: any) {
                            console.error('❌ Error confirming booking:', error);
                            Alert.alert('Ошибка', error.message || 'Не удалось подтвердить бронирование');
                        }
                    },
                },
            ]
        );
    };

    const handleCancelBooking = () => {
        if (!booking) return;

        Alert.alert(
            'Отменить бронирование',
            'Вы уверены, что хотите отменить это бронирование?',
            [
                { text: 'Нет', style: 'cancel' },
                {
                    text: 'Да',
                    onPress: async () => {
                        try {
                            await bookingsApiService.remove(booking.id);
                            navigation.goBack();
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

    const navigateToProfile = (userId: number, isViewingOwnProfile: boolean = false) => {
        navigation.navigate('Profile', {
            userId: isViewingOwnProfile ? undefined : userId
        });
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.red[500]} />
                <Text style={styles.errorText}>Бронирование не найдено</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Детали бронирования</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View style={styles.statusInfo}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                        </View>
                        <Text style={styles.bookingId}>#{booking.id}</Text>
                    </View>

                    <Text style={styles.totalPrice}>
                        {formatPriceWithCurrency(booking.totalPrice || 0, booking.currency || '₽')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Информация об объекте</Text>
                    <Text style={styles.listingTitle}>
                        {booking.listingTitle || `Бронирование #${booking.id}`}
                    </Text>

                    {booking.firstListingPhoto && (
                        <Image
                            source={{ uri: booking.firstListingPhoto }}
                            style={styles.listingImage}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Участники</Text>
                    <View style={styles.participantsContainer}>
                        {/* Кликабельный арендатор */}
                        <TouchableOpacity
                            style={styles.participant}
                            onPress={() => {
                                const isRenterCurrentUser = booking.renter?.id === currentUser?.id;
                                navigateToProfile(booking.renter?.id || 0, isRenterCurrentUser);
                            }}
                        >
                            <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.participantLabel}>Арендатор:</Text>
                            <View style={styles.participantInfo}>
                                <Text style={styles.participantName}>
                                    {booking.renter?.firstName} {booking.renter?.lastName}
                                </Text>
                                {booking.renter?.id === currentUser?.id && (
                                    <Text style={styles.youBadge}>(Вы)</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>

                        {/* Кликабельный владелец */}
                        <TouchableOpacity
                            style={styles.participant}
                            onPress={() => {
                                const isLandlordCurrentUser = booking.landlord?.id === currentUser?.id;
                                navigateToProfile(booking.landlord?.id || 0, isLandlordCurrentUser);
                            }}
                        >
                            <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.participantLabel}>Владелец:</Text>
                            <View style={styles.participantInfo}>
                                <Text style={styles.participantName}>
                                    {booking.landlord?.firstName} {booking.landlord?.lastName}
                                </Text>
                                {booking.landlord?.id === currentUser?.id && (
                                    <Text style={styles.youBadge}>(Вы)</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {(booking.periodStart && booking.periodEnd) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Период бронирования</Text>
                        <View style={styles.periodContainer}>
                            <View style={styles.periodRow}>
                                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                                <Text style={styles.periodLabel}>Начало:</Text>
                                <View style={styles.dateTimeContainer}>
                                    <Text style={styles.dateValue}>
                                        {new Date(booking.periodStart).toLocaleDateString('ru-RU')}
                                    </Text>
                                    {booking.periodStartTime && (
                                        <Text style={styles.dateValue}>
                                            {booking.periodStartTime}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.periodRow}>
                                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                                <Text style={styles.periodLabel}>Окончание:</Text>
                                <View style={styles.dateTimeContainer}>
                                    <Text style={styles.dateValue}>
                                        {new Date(booking.periodEnd).toLocaleDateString('ru-RU')}
                                    </Text>
                                    {booking.periodEndTime && (
                                        <Text style={styles.dateValue}>
                                            {booking.periodEndTime}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {booking.durationDays && booking.durationDays > 0 && (
                                <View style={styles.periodRow}>
                                    <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                                    <Text style={styles.periodLabel}>Продолжительность:</Text>
                                    <Text style={styles.periodValue}>
                                        {booking.durationDays} {booking.durationDays === 1 ? 'день' :
                                        booking.durationDays < 5 ? 'дня' : 'дней'}
                                        {booking.durationDays === 1 ? ' (24 часа)' : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Дополнительная информация</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Валюта</Text>
                            <Text style={styles.infoValue}>{booking.currency || 'RUB'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Создано</Text>
                            <Text style={styles.infoValue}>
                                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {/* Для арендодателя в статусе PENDING показываем кнопки подтвердить/отклонить */}
                {isLandlord && booking?.status === 'PENDING' && (
                    <View style={styles.landlordActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleCancelBooking}
                        >
                            <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Отклонить</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.confirmButton]}
                            onPress={handleConfirmBooking}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Подтвердить</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Для арендатора в статусе PENDING показываем кнопку отмены */}
                {isRenter && booking?.status === 'PENDING' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelBooking}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                        <Text style={styles.cancelButtonText}>Отменить бронирование</Text>
                    </TouchableOpacity>
                )}
            </View>
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
    content: {
        flex: 1,
        padding: 16,
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
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.gray[600],
    },
    statusCard: {
        backgroundColor: COLORS.gray[100],
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    bookingId: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    listingTitle: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginLeft: 8,
    },
    datesGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    dateCard: {
        flex: 1,
        backgroundColor: COLORS.gray[100],
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 12,
        color: COLORS.gray[500],
        marginTop: 8,
        marginBottom: 4,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    infoItem: {
        flex: 1,
        minWidth: '45%',
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.gray[500],
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
        backgroundColor: COLORS.white,
        marginBottom: 20,
    },
    cancelButton: {
        backgroundColor: COLORS.red[500],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    landlordActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: COLORS.green[500],
    },
    cancelButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    listingImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginVertical: 12,
    },
    participantsContainer: {
        gap: 12,
    },
    participant: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    participantLabel: {
        fontSize: 14,
        color: COLORS.gray[600],
        minWidth: 100,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    youBadge: {
        fontSize: 12,
        color: COLORS.gray[500],
        fontStyle: 'italic',
    },
    participantName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    periodContainer: {
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    periodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    periodLabel: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginLeft: 8,
        marginRight: 8,
        minWidth: 120,
    },
    periodValue: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        flex: 1,
    },
});