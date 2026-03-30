import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YaMap, {Marker, CameraPosition, InitialRegion} from 'react-native-yamap';
import { COLORS } from '@/shared/constants/colors';
import { Listing } from "@/types/profile";
import {formatListingForDisplay, formatNumberWithSpaces} from "@shared/utils/listingFormatter";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@navigation/types";
import { useAuth } from '@hooks/auth/useAuth';
import { useChat } from '@hooks/chat/useChat';
import { favoritesService } from '@services/favoritesService';
import {Conversation} from "@/types/chat";
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { bookingsService, CreateBookingDto } from '@services/bookingsService';
import {listingApiService} from "@services/api/listingApi";
import {bookingsApiService} from "@services/api/bookingsApi";

interface AdvertisementDetailsProps {
    listing: Listing;
    onContactPress: () => void;
    onFavoritePress: () => void;
    onScroll?: (event: any) => void;
    scrollEnabled?: boolean;
}

/**
 * Компонент детальной информации объявления
 * Отображает всю информацию об объекте: цены, описание, удобства, карту, контакты
 * и функционал бронирования/чата
 */
export const AdvertisementDetails: React.FC<AdvertisementDetailsProps> = ({
                                                                              listing,
                                                                              onContactPress,
                                                                              onFavoritePress,
                                                                              onScroll,
                                                                              scrollEnabled = true,
                                                                          }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user, isAuthenticated } = useAuth();
    const { createConversation } = useChat();

    /**
     * Флаг статуса "в избранном" для текущего объявления
     */
    const [isFavorite, setIsFavorite] = useState(false);

    /**
     * Флаг процесса создания чата
     */
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    /**
     * Флаг видимости модального окна бронирования
     */
    const [showBookingModal, setShowBookingModal] = useState(false);

    /**
     * Выбранные даты для бронирования
     */
    const [bookingDates, setBookingDates] = useState<{start: Date | null, end: Date | null}>({ start: null, end: null });

    /**
     * Флаг процесса бронирования
     */
    const [isBooking, setIsBooking] = useState(false);

    /**
     * Доступные слоты для бронирования
     */
    const [availableSlots, setAvailableSlots] = useState<Array<{start: string, end: string}>>([]);

    /**
     * Существующие бронирования объекта
     */
    const [existingBookings, setExistingBookings] = useState<any[]>([]);

    /**
     * Флаг загрузки существующих бронирований
     */
    const [loadingBookings, setLoadingBookings] = useState(false);

    /**
     * Отформатированные данные объявления для отображения
     */
    const formattedListing = formatListingForDisplay(listing);
    const { fetchConversations } = useChat();

    useEffect(() => {
        checkFavoriteStatus();
    }, [listing.id]);

    useEffect(() => {
        if (showBookingModal) {
            loadExistingBookings();
        }
    }, [showBookingModal]);

    /**
     * Загружает существующие бронирования объекта
     * Используется для проверки доступности дат
     */
    const loadExistingBookings = async () => {
        try {
            setLoadingBookings(true);
            const response = await bookingsApiService.findAll({
                limit: 100,
                offset: 0
            });
            const activeBookings = response.bookings.filter(booking =>
                booking.status === 'PENDING' || booking.status === 'CONFIRMED'
            );

            console.log('📦 Активные бронирования:', activeBookings);
            setExistingBookings(activeBookings);

        } catch (error) {
            console.error('❌ Ошибка при загрузке бронирований:', error);
            Alert.alert('Ошибка', 'Не удалось проверить доступность дат');
            setExistingBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    };

    /**
     * Проверяет статус объявления в избранном пользователя
     */
    const checkFavoriteStatus = async () => {
        const favorite = await favoritesService.isListingFavorite(listing.id);
        setIsFavorite(favorite);
    };

    /**
     * Возвращает начальный регион для карты в формате CameraPosition
     */
    const getInitialRegionForMap = (): InitialRegion | undefined => {
        const coordinates = parseLocation(listing.location);
        if (coordinates) {
            return {
                lat: coordinates.latitude,
                lon: coordinates.longitude,
                zoom: 15,
                tilt: 0,
                azimuth: 0,
            };
        }
        return undefined;
    };


    /**
     * Обрабатывает добавление/удаление объявления из избранного
     * Синхронизирует состояние с локальным хранилищем и сервером
     */
    const handleFavoritePress = async () => {
        try {
            if (isFavorite) {
                const favorites = await favoritesService.loadFavorites();
                const favoriteItem = favorites.find(
                    item => item.type === 'listing' && item.data.id === listing.id
                );

                if (favoriteItem) {
                    await favoritesService.removeFavorite(favoriteItem.id);
                }
            } else {
                await favoritesService.addListing(listing);
            }

            setIsFavorite(!isFavorite);
            onFavoritePress();
        } catch (error) {
            console.error('❌ Ошибка при работе с избранным:', error);
            Alert.alert('Ошибка', 'Не удалось обновить избранное');
        }
    };

    /**
     * Обрабатывает переход на экран карты
     * Передает данные объявления для отображения на карте
     */
    const handleMapPress = () => {
        navigation.navigate('MapScreen', { listing });
    };

    /**
     * Обрабатывает создание/открытие чата с владельцем объявления
     * Проверяет авторизацию, ищет существующий чат или создает новый
     */
    const handleChatPress = async () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Необходима авторизация',
                'Чтобы написать сообщение, войдите в аккаунт',
                [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Войти', onPress: () => navigation.navigate('EmailAuth') }
                ]
            );
            return;
        }

        if (user?.id === listing.userId) {
            Alert.alert('Невозможно отправить сообщение', 'Вы не можете написать самому себе');
            return;
        }

        try {
            setIsCreatingChat(true);

            let conversation;

            try {
                conversation = await createConversation({
                    participantId: listing.userId,
                    listingId: listing.id
                });

            } catch (error: any) {
                if (error.message?.includes('Conversation already exists') ||
                    error.message?.includes('уже существует')) {

                    const response = await fetchConversations({
                        limit: 100,
                        offset: 0
                    });

                    const existingConversation = response.conversations.find((conv: Conversation) =>
                        conv.listing?.id === listing.id &&
                        (conv.participant1.id === listing.userId || conv.participant2.id === listing.userId)
                    );

                    if (!existingConversation) {
                        conversation = response.conversations.find((conv: Conversation) =>
                            conv.participant1.id === listing.userId || conv.participant2.id === listing.userId
                        );

                        if (!conversation) {
                            throw new Error('Чат существует, но не найден в списке');
                        }
                    } else {
                        conversation = existingConversation;
                    }

                } else {
                    throw error;
                }
            }

            navigation.navigate('Chat', {
                conversationId: conversation.id
            });

        } catch (error: any) {
            console.error('❌ Error handling conversation:', error);

            Alert.alert(
                'Ошибка',
                error.message || 'Не удалось открыть чат. Попробуйте позже.'
            );
        } finally {
            setIsCreatingChat(false);
        }
    };

    /**
     * Обрабатывает начало процесса бронирования
     * Загружает доступные слоты и открывает модальное окно
     */
    const handleBookPress = async () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Необходима авторизация',
                'Чтобы забронировать объект, войдите в аккаунт',
                [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Войти', onPress: () => navigation.navigate('EmailAuth') }
                ]
            );
            return;
        }

        if (user?.id === listing.userId) {
            Alert.alert('Невозможно забронировать', 'Вы не можете забронировать свой собственный объект');
            return;
        }

        try {
            // Загружаем доступные слоты
            if (listing.availability && Array.isArray(listing.availability)) {
                setAvailableSlots(listing.availability);
            } else {
                // Или получаем из API
                const listingDetails = await listingApiService.getListingById(listing.id);
                if (listingDetails.availability) {
                    setAvailableSlots(Array.isArray(listingDetails.availability) ? listingDetails.availability : []);
                }
            }

            setShowBookingModal(true);
        } catch (error) {
            console.error('Error loading availability:', error);
            setShowBookingModal(true);
        }
    };

    /**
     * Обрабатывает выбор диапазона дат для бронирования
     * @param start - начальная дата
     * @param end - конечная дата
     */
    const handleDateRangeSelected = (start: Date, end: Date) => {
        setBookingDates({ start, end });
    };

    /**
     * Подтверждает бронирование с выбранными датами
     * Проверяет корректность данных и отправляет запрос на сервер
     */
    const confirmBooking = async () => {
        if (!bookingDates.start || !bookingDates.end) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите даты бронирования');
            return;
        }

        if (bookingDates.end <= bookingDates.start) {
            Alert.alert('Ошибка', 'Дата окончания должна быть позже даты начала');
            return;
        }

        const today = new Date();
        if (bookingDates.start < today) {
            Alert.alert('Ошибка', 'Нельзя забронировать объект на прошедшую дату');
            return;
        }

        // Проверяем, не забронированы ли выбранные даты
        if (isRangeBooked(bookingDates.start, bookingDates.end)) {
            Alert.alert('Ошибка', 'Выбранные даты уже забронированы другим пользователем');
            return;
        }

        setIsBooking(true);
        try {
            const bookingData = {
                listingId: listing.id,
                period: {
                    start: bookingDates.start.toISOString(),
                    end: bookingDates.end.toISOString(),
                }
            };

            await bookingsApiService.create(bookingData);

            Alert.alert(
                'Успешно!',
                'Объект успешно забронирован. Вы можете увидеть свои бронирования в разделе "Мои бронирования".',
                [
                    {
                        text: 'ОК',
                        onPress: () => {
                            setShowBookingModal(false);
                            setBookingDates({ start: null, end: null });
                            loadExistingBookings();
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('❌ Ошибка при бронировании:', error);

            let errorMessage = 'Не удалось создать бронирование';
            if (error.message?.includes('недоступен') || error.message?.includes('Conflict')) {
                errorMessage = 'Объект уже забронирован на выбранные даты. Пожалуйста, выберите другие даты.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Ошибка', errorMessage);
        } finally {
            setIsBooking(false);
        }
    };

    /**
     * Рассчитывает итоговую стоимость бронирования на основе выбранного периода
     * @returns отформатированную строку с итоговой ценой
     */
    const calculateTotalPrice = () => {
        if (!bookingDates.start || !bookingDates.end || !listing.price) return '0';

        const durationMs = bookingDates.end.getTime() - bookingDates.start.getTime();
        let duration;

        switch (listing.pricePeriod) {
            case 'HOUR':
                duration = Math.ceil(durationMs / (1000 * 60 * 60));
                break;
            case 'DAY':
                duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
                break;
            case 'WEEK':
                duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
                break;
            case 'MONTH':
                duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30));
                break;
            default:
                duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        }

        const totalPrice = (listing.price * duration);
        return formatNumberWithSpaces(totalPrice);
    };

    /**
     * Преобразует тип помещения в читаемый формат
     * @returns локализованное название типа помещения
     */
    const getTypeLabel = () => {
        switch (listing.type) {
            case 'PARKING': return 'Парковочное место';
            case 'STORAGE': return 'Кладовое помещение';
            case 'GARAGE': return 'Гараж';
            default: return 'Помещение';
        }
    };

    /**
     * Извлекает список удобств из данных объявления
     * Обрабатывает разные форматы хранения удобств (массив, объект)
     * @returns массив удобств
     */
    const getAmenitiesList = () => {
        if (!listing.amenities) return [];

        if (Array.isArray(listing.amenities)) {
            return listing.amenities;
        }

        if (typeof listing.amenities === 'object') {
            return Object.entries(listing.amenities)
                .filter(([_, value]) => Boolean(value))
                .map(([key]) => key);
        }

        return [];
    };

    /**
     * Извлекает имя контактного лица из данных объявления
     * Обрабатывает разные форматы хранения контактной информации
     * @returns строку с именем контактного лица
     */
    const getContactName = () => {
        if ((listing as any).user) {
            const user = (listing as any).user;
            const nameParts = [];
            if (user.firstName) nameParts.push(user.firstName);
            if (user.lastName) nameParts.push(user.lastName);
            if (user.patronymic) nameParts.push(user.patronymic);

            return nameParts.join(' ') || 'Не указано';
        }

        if (listing.contact?.name) {
            return listing.contact.name;
        }

        return 'Не указано';
    };

    /**
     * Преобразует ключ удобства в читаемый формат
     * @param amenity - ключ удобства
     * @returns локализованное название удобства
     */
    const getAmenityLabel = (amenity: string) => {
        const amenityLabels: Record<string, string> = {
            heating: 'Отопление',
            security: 'Охрана',
            electricity: 'Электричество',
            ventilation: 'Вентиляция',
            lighting: 'Освещение',
            water: 'Водоснабжение',
            camera: 'Видеонаблюдение',
            parking: 'Парковка',
        };

        return amenityLabels[amenity] || amenity;
    };

    /**
     * Проверяет забронирована ли конкретная дата
     * @param date - дата для проверки
     * @returns true если дата забронирована
     */
    const isDateBooked = (date: Date): boolean => {
        if (existingBookings.length === 0) return false;

        return existingBookings.some(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);

            // Сбрасываем время для сравнения только дат
            bookingStart.setHours(0, 0, 0, 0);
            bookingEnd.setHours(0, 0, 0, 0);

            return date >= bookingStart && date <= bookingEnd;
        });
    };

    /**
     * Проверяет забронирован ли весь диапазон дат
     * @param start - начальная дата диапазона
     * @param end - конечная дата диапазона
     * @returns true если диапазон полностью или частично забронирован
     */
    const isRangeBooked = (start: Date, end: Date): boolean => {
        if (existingBookings.length === 0) return false;

        // Проверяем каждую дату в диапазоне
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (isDateBooked(new Date(d))) {
                return true;
            }
        }

        return false;
    };

    /**
     * Парсит данные местоположения из разных форматов
     * Поддерживает POINT строки, GeoJSON объекты
     * @param location - данные местоположения
     * @returns координаты или null
     */
    const parseLocation = (location: any) => {
        if (!location) return null;

        if (typeof location === 'object' && location.type === 'Point' && location.coordinates) {
            const [longitude, latitude] = location.coordinates;
            return { latitude, longitude };
        }

        if (typeof location === 'string') {
            const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match && match[1] && match[2]) {
                const longitude = parseFloat(match[1]);
                const latitude = parseFloat(match[2]);
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    return { latitude, longitude };
                }
            }
        }

        return null;
    };

    /**
     * Возвращает начальный регион для карты
     * Использует координаты объявления или значения по умолчанию
     * @returns объект региона для MapView
     */
    const getInitialRegion = () => {
        const coordinates = parseLocation(listing.location);

        if (coordinates) {
            return {
                ...coordinates,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        return {
            latitude: 55.7558,
            longitude: 37.6173,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    };

    /**
     * Форматирует дату в читаемый строковый формат
     * @param dateString - строка с датой
     * @returns отформатированную строку даты
     */
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Формирует строку с деталями помещения (площадь и тип)
     * @returns строку с деталями помещения
     */
    const getPropertyDetails = () => {
        const details = [];

        if (listing.size) {
            details.push(`${listing.size} м²`);
        }

        switch (listing.type) {
            case 'PARKING':
                details.push('Парковочное место');
                break;
            case 'GARAGE':
                details.push('Гараж');
                break;
            case 'STORAGE':
                details.push('Кладовое помещение');
                break;
        }

        return details.join(' • ');
    };

    /**
     * Преобразует период цены в читаемый формат
     * @returns строку с периодом цены
     */
    const getPricePeriodText = () => {
        switch (listing.pricePeriod) {
            case 'HOUR': return 'час';
            case 'DAY': return 'день';
            case 'WEEK': return 'неделю';
            case 'MONTH': return 'месяц';
            default: return 'период';
        }
    };

    const availability = Array.isArray(listing.availability) ? listing.availability : [];

    return (
        <>
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            scrollEnabled={scrollEnabled}
        >
            {/* Заголовок и цена */}
            <View style={styles.header}>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{formattedListing.displayPrice}</Text>
                    <Text style={styles.priceSubtitle}>Хорошая цена</Text>
                </View>

                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={handleFavoritePress}
                >
                    <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={24}
                        color={isFavorite ? COLORS.red[50] : COLORS.gray[400]}
                    />
                </TouchableOpacity>
            </View>

            {/* Основная информация */}
            <View style={styles.section}>
                <Text style={styles.type}>{getTypeLabel()}</Text>
                <Text style={styles.propertyDetails}>{getPropertyDetails()}</Text>
                <Text style={styles.address}>{listing.address}</Text>
            </View>

            {/* Расположение */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Расположение</Text>
                <TouchableOpacity style={styles.mapContainer} onPress={handleMapPress}>
                    {getInitialRegionForMap() ? (
                        <YaMap
                            style={styles.map}
                            initialRegion={getInitialRegionForMap()!}
                            scrollGesturesEnabled={false}
                            zoomGesturesEnabled={false}
                            tiltGesturesEnabled={false}
                            rotateGesturesEnabled={false}
                        >
                            <Marker point={{
                                lat: parseLocation(listing.location)!.latitude,
                                lon: parseLocation(listing.location)!.longitude
                            }} />
                        </YaMap>
                    ) : (
                        <View style={[styles.map, styles.mapPlaceholder]}>
                            <Text>Адрес: {listing.address}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Контакты */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Контактное лицо</Text>
                <Text style={styles.contactName}>
                    {getContactName()}
                </Text>
                <Text style={styles.contactDate}>
                    Обновлено {formatDate(listing.updatedAt)}
                </Text>
            </View>

            {/* Просмотры */}
            {listing.views && (
                <View style={styles.section}>
                    <View style={styles.viewsContainer}>
                        <Text style={styles.viewsText}>
                            Всего просмотров: {listing.views.total || 0}
                        </Text>
                        <Text style={styles.viewsText}>
                            За сегодня: {listing.views.daily || 0}
                        </Text>
                    </View>
                </View>
            )}

            {/* Удобства */}
            {getAmenitiesList().length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Удобства</Text>
                    <View style={styles.amenitiesContainer}>
                        {getAmenitiesList().map((amenity, index) => (
                            <View key={index} style={styles.amenityTag}>
                                <Text style={styles.amenityText}>{getAmenityLabel(amenity)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Описание */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Описание</Text>
                <Text style={styles.description}>
                    {listing.description || 'Описание отсутствует'}
                </Text>
            </View>

            {/* Доступность */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Доступность</Text>
                <View style={styles.availabilityContainer}>
                    {availability.length > 0 ? (
                        availability.map((slot, index) => (
                            <View key={index} style={styles.availabilitySlot}>
                                <Text style={styles.availabilityText}>
                                    {formatDate(slot.start)} - {formatDate(slot.end)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noAvailability}>Нет данных о доступности</Text>
                    )}
                </View>
            </View>

            {/* Кнопка бронирования */}
            <View style={styles.bookingButtonContainer}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={handleBookPress}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={COLORS.white}
                        style={styles.buttonIcon}
                    />
                    <Text style={styles.bookButtonText}>
                        Забронировать
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Кнопка чата и вызова */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.chatButton]}
                    onPress={handleChatPress}
                    disabled={isCreatingChat}
                >
                    <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color={COLORS.white}
                        style={styles.buttonIcon}
                    />
                    <Text style={styles.chatButtonText}>
                        {isCreatingChat ? 'Создание чата...' : 'Написать в чат'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={onContactPress}
                >
                    <Ionicons
                        name="call-outline"
                        size={20}
                        color={COLORS.primary}
                        style={styles.buttonIcon}
                    />
                    <Text style={styles.callButtonText}>Позвонить</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
            {/* Модальное окно бронирования */}
            <Modal
                visible={showBookingModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowBookingModal(false);
                    setBookingDates({ start: null, end: null });
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Бронирование объекта</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowBookingModal(false);
                                    setBookingDates({ start: null, end: null });
                                }}
                                disabled={isBooking}
                            >
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.bookingContent}>
                            <Text style={styles.bookingSectionTitle}>Выберите период бронирования</Text>

                            <DateRangePicker
                                onDateRangeSelected={handleDateRangeSelected}
                                minDate={new Date()}
                                availableDates={availableSlots}
                                bookedDates={existingBookings.map(booking => ({
                                    start: booking.startDate,
                                    end: booking.endDate
                                }))}
                            />

                            {bookingDates.start && bookingDates.end && (
                                <View style={styles.bookingSummary}>
                                    <Text style={styles.summaryTitle}>Детали бронирования:</Text>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Объект:</Text>
                                        <Text style={styles.summaryValue}>{getTypeLabel()}</Text>
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Адрес:</Text>
                                        <Text style={styles.summaryValue}>{listing.address}</Text>
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Период:</Text>
                                        <Text style={styles.summaryValue}>
                                            {bookingDates.start.toLocaleDateString('ru-RU')} - {bookingDates.end.toLocaleDateString('ru-RU')}
                                        </Text>
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Цена за {getPricePeriodText()}:</Text>
                                        <Text style={styles.summaryValue}>
                                            {formatNumberWithSpaces(listing.price)} руб.
                                        </Text>
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Итоговая цена:</Text>
                                        <Text style={styles.totalPrice}>{calculateTotalPrice()} руб.</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.bookingNotice}>
                                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.bookingNoticeText}>
                                    После подтверждения бронирования владелец объекта получит уведомление и подтвердит вашу заявку.
                                </Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowBookingModal(false);
                                    setBookingDates({ start: null, end: null });
                                }}
                                disabled={isBooking}
                            >
                                <Text style={styles.cancelButtonText}>Отмена</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalActionButton,
                                    styles.confirmButton,
                                    (!bookingDates.start || !bookingDates.end) && styles.confirmButtonDisabled
                                ]}
                                onPress={confirmBooking}
                                disabled={!bookingDates.start || !bookingDates.end || isBooking}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {isBooking ? 'Бронирование...' : 'Подтвердить бронирование'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
    </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    priceContainer: {
        flex: 1,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    priceSubtitle: {
        fontSize: 14,
        color: COLORS.green[500],
        marginTop: 4,
    },
    favoriteButton: {
        padding: 8,
    },
    section: {
        marginBottom: 20,
    },
    type: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    propertyDetails: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginBottom: 8,
    },
    address: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    mapContainer: {
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    contactDate: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    viewsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    viewsText: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
    amenitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityTag: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    amenityText: {
        fontSize: 12,
        color: COLORS.primary,
    },
    mapPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.gray[100],
        borderRadius: 8,
        padding: 16,
    },
    description: {
        fontSize: 14,
        color: COLORS.gray[600],
        lineHeight: 20,
    },
    availabilityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    availabilitySlot: {
        backgroundColor: COLORS.gray[100],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    availabilityText: {
        fontSize: 12,
        color: COLORS.gray[700],
    },
    noAvailability: {
        fontSize: 14,
        color: COLORS.gray[500],
        fontStyle: 'italic',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    chatButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    callButton: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary,
    },
    buttonIcon: {
        marginRight: 8,
    },
    chatButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    callButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    bookingButtonContainer: {
        marginHorizontal: 16,
        marginBottom: 10,
    },
    bookButton: {
        backgroundColor: COLORS.green[500],
        borderColor: COLORS.green[500],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },

    // Стили для модального окна бронирования
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    bookingContent: {
        padding: 20,
        maxHeight: 500,
    },
    bookingSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    bookingSummary: {
        backgroundColor: COLORS.gray[100],
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.gray[600],
        flex: 1,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        flex: 1,
        textAlign: 'right',
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'right',
    },
    bookingNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primaryLight,
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
        gap: 8,
    },
    bookingNoticeText: {
        fontSize: 12,
        color: COLORS.primary,
        flex: 1,
        lineHeight: 16,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
        gap: 12,
    },
    modalActionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    cancelButton: {
        backgroundColor: COLORS.gray[200],
    },
    cancelButtonText: {
        color: COLORS.gray[700],
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.gray[300],
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});