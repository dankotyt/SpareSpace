import { Booking } from '@/services/api/bookingsApi';

/**
 * Фильтрует бронирования, где пользователь является арендодателем
 * @param bookings - массив бронирований для фильтрации
 * @param userId - ID пользователя для проверки
 * @returns Отфильтрованный массив бронирований арендодателя
 */
export const getLandlordBookings = (bookings: Booking[], userId: number): Booking[] => {
    return bookings.filter(booking => booking.landlord?.id === userId);
};

/**
 * Фильтрует бронирования, где пользователь является арендатором
 * @param bookings - массив бронирований для фильтрации
 * @param userId - ID пользователя для проверки
 * @returns Отфильтрованный массив бронирований арендатора
 */
export const getRenterBookings = (bookings: Booking[], userId: number): Booking[] => {
    return bookings.filter(booking => booking.renter?.id === userId);
};

/**
 * Получает количество ожидающих подтверждения бронирований для арендодателя
 * @param bookings - массив всех бронирований
 * @param userId - ID пользователя-арендодателя
 * @returns Количество бронирований со статусом PENDING
 */
export const getPendingLandlordBookingsCount = (bookings: Booking[], userId: number): number => {
    const landlordBookings = getLandlordBookings(bookings, userId);
    return landlordBookings.filter(b => b.status === 'PENDING').length;
};