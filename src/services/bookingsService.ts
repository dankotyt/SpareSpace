import { bookingsApiService, CreateBookingDto, Booking, BookingsResponse } from '@/services/api/bookingsApi';
import { Alert } from 'react-native';

/**
 * Сервис-обертка для работы с бронированиями
 * Добавляет обработку ошибок и пользовательские уведомления к базовому API
 */
class BookingsService {

    /**
     * Создает новое бронирование
     * @param bookingData - DTO с данными бронирования
     * @returns Промис с созданным бронированием
     * @throws Error с пользовательским сообщением при ошибке
     */
    async createBooking(bookingData: CreateBookingDto): Promise<Booking> {
        try {
            return await bookingsApiService.create(bookingData);
        } catch (error: any) {
            console.error('❌ Error creating booking:', error);

            let errorMessage = 'Не удалось создать бронирование';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message?.includes('409')) {
                errorMessage = 'Объект уже забронирован на выбранные даты';
            } else if (error.message?.includes('400')) {
                errorMessage = 'Некорректные данные для бронирования';
            }

            Alert.alert('Ошибка', errorMessage);
            throw error;
        }
    }

    /**
     * Получает информацию о конкретном бронировании по ID
     * @param id - ID бронирования
     * @returns Промис с данными бронирования
     * @throws Error с пользовательским сообщением при ошибке
     */
    async getBookingById(id: number): Promise<Booking> {
        try {
            return await bookingsApiService.findOne(id);
        } catch (error) {
            console.error('❌ Error fetching booking:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить информацию о бронировании');
            throw error;
        }
    }

    /**
     * Отменяет существующее бронирование
     * @param id - ID бронирования для отмены
     * @throws Error с пользовательским сообщением при ошибке
     */
    async cancelBooking(id: number): Promise<void> {
        try {
            return await bookingsApiService.remove(id);
        } catch (error) {
            console.error('❌ Error canceling booking:', error);
            Alert.alert('Ошибка', 'Не удалось отменить бронирование');
            throw error;
        }
    }

    /**
     * Обновляет данные существующего бронирования
     * @param id - ID бронирования для обновления
     * @param bookingData - частичные данные для обновления
     * @returns Промис с обновленным бронированием
     * @throws Error с пользовательским сообщением при ошибке
     */
    async updateBooking(id: number, bookingData: Partial<CreateBookingDto>): Promise<Booking> {
        try {
            return await bookingsApiService.update(id, bookingData);
        } catch (error) {
            console.error('❌ Error updating booking:', error);
            Alert.alert('Ошибка', 'Не удалось обновить бронирование');
            throw error;
        }
    }

    /**
     * Изменяет статус бронирования (подтвердить/отменить)
     * @param id - ID бронирования
     * @param status - новый статус
     * @returns Промис с обновленным бронированием
     * @throws Error с пользовательским сообщением при ошибке
     */
    async changeBookingStatus(id: number, status: 'CONFIRMED' | 'CANCELLED'): Promise<Booking> {
        try {
            return await bookingsApiService.changeStatus(id, status);
        } catch (error) {
            console.error('❌ Error changing booking status:', error);
            Alert.alert('Ошибка', 'Не удалось изменить статус бронирования');
            throw error;
        }
    }

    /**
     * Проверяет доступность парковочного места на указанный период
     * @param listingId - ID парковочного места
     * @param startDate - дата начала бронирования
     * @param endDate - дата окончания бронирования
     * @returns Промис с булевым значением доступности
     */
    async checkAvailability(listingId: number, startDate: Date, endDate: Date): Promise<boolean> {
        try {
            const response = await bookingsApiService.checkAvailability(listingId, startDate, endDate);
            return response.available;
        } catch (error) {
            console.error('❌ Error checking availability:', error);
            return false;
        }
    }
}

export const bookingsService = new BookingsService();
export type { CreateBookingDto, Booking, BookingsResponse };