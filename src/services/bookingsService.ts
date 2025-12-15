import { bookingsApiService, CreateBookingDto, Booking, BookingsResponse } from '@/services/api/bookingsApi';
import { Alert } from 'react-native';

class BookingsService {
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

    async getBookingById(id: number): Promise<Booking> {
        try {
            return await bookingsApiService.findOne(id);
        } catch (error) {
            console.error('❌ Error fetching booking:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить информацию о бронировании');
            throw error;
        }
    }

    async cancelBooking(id: number): Promise<void> {
        try {
            return await bookingsApiService.remove(id);
        } catch (error) {
            console.error('❌ Error canceling booking:', error);
            Alert.alert('Ошибка', 'Не удалось отменить бронирование');
            throw error;
        }
    }

    async updateBooking(id: number, bookingData: Partial<CreateBookingDto>): Promise<Booking> {
        try {
            return await bookingsApiService.update(id, bookingData);
        } catch (error) {
            console.error('❌ Error updating booking:', error);
            Alert.alert('Ошибка', 'Не удалось обновить бронирование');
            throw error;
        }
    }

    async changeBookingStatus(id: number, status: 'CONFIRMED' | 'CANCELLED'): Promise<Booking> {
        try {
            return await bookingsApiService.changeStatus(id, status);
        } catch (error) {
            console.error('❌ Error changing booking status:', error);
            Alert.alert('Ошибка', 'Не удалось изменить статус бронирования');
            throw error;
        }
    }

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