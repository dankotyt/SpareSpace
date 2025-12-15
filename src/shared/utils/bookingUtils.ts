import { Booking } from '@/services/api/bookingsApi';

/**
 * Фильтрует бронирования, где пользователь является арендодателем
 */
export const getLandlordBookings = (bookings: Booking[], userId: number): Booking[] => {
    return bookings.filter(booking => booking.landlord?.id === userId);
};

/**
 * Фильтрует бронирования, где пользователь является арендатором
 */
export const getRenterBookings = (bookings: Booking[], userId: number): Booking[] => {
    return bookings.filter(booking => booking.renter?.id === userId);
};

/**
 * Получает количество ожидающих подтверждения бронирований для арендодателя
 */
export const getPendingLandlordBookingsCount = (bookings: Booking[], userId: number): number => {
    const landlordBookings = getLandlordBookings(bookings, userId);
    return landlordBookings.filter(b => b.status === 'PENDING').length;
};