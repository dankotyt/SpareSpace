import {tokenService} from '@/services/tokenService';
import {API_BASE_URL} from '@/config/env';

export interface CreateBookingDto {
    listingId: number;
    period: {
        start: string;
        end: string;
    };
}

export interface Booking {
    id: number;
    listingTitle: string;
    firstListingPhoto: string | null;
    renter: {
        id: number;
        firstName: string;
        lastName: string;
        patronymic: string | null;
        rating: number | null;
        verified: boolean;
        isOnline: boolean;
        lastSeenAt: string;
        createdAt: string;
    };
    landlord: {
        id: number;
        firstName: string;
        lastName: string;
        patronymic: string | null;
        rating: number | null;
        verified: boolean;
        isOnline: boolean;
        lastSeenAt: string;
        createdAt: string;
    };
    totalPrice: number;
    currency: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    createdAt: string;

    period?: string;
}

export interface BookingWithPeriod extends Booking {
    periodStart?: string;
    periodEnd?: string;
    periodStartTime?: string;
    periodEndTime?: string;
    durationDays?: number;
}

export interface BookingsResponse {
    bookings: Booking[];
    total: number;
    limit: number;
    offset: number;
}

export interface SearchBookingsDto {
    limit?: number;
    offset?: number;
    status?: string;
}

class BookingsApiService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = await tokenService.getToken();

        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    }

    // Создание бронирования
    async create(dto: CreateBookingDto): Promise<Booking> {
        const requestBody = {
            listingId: dto.listingId,
            period: {
                start: dto.period.start,
                end: dto.period.end,
            }
        };

        return this.request<Booking>('/bookings', {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
    }

    // Получение списка бронирований
    async findAll(dto: SearchBookingsDto = {}): Promise<BookingsResponse> {
        const params = new URLSearchParams();

        if (dto.limit) params.append('limit', dto.limit.toString());
        if (dto.offset) params.append('offset', dto.offset.toString());
        if (dto.status) params.append('status', dto.status);

        const queryString = params.toString();
        const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;

        return this.request<BookingsResponse>(endpoint);
    }

    // Получение одного бронирования
    async findOne(id: number): Promise<Booking> {
        const booking = await this.request<any>(`/bookings/${id}`);

        return {
            id: booking.id,
            listingTitle: booking.listing?.title || '',
            firstListingPhoto: booking.listing?.images?.[0] || null,
            renter: booking.renter,
            landlord: booking.listing?.user,
            totalPrice: booking.totalPrice || 0,
            currency: booking.currency || 'RUB',
            status: booking.status || 'PENDING',
            createdAt: booking.createdAt || new Date().toISOString(),
            // Если period приходит как объект, оставляем как есть
            // Иначе парсим строку
            period: booking.period,
        };
    }

    // Обновление бронирования
    async update(id: number, dto: Partial<CreateBookingDto>): Promise<Booking> {
        const body: any = { ...dto };
        if (dto.period?.start) body.startDate = dto.period.start.toString();
        if (dto.period?.end) body.endDate = dto.period.end.toString();

        return this.request<Booking>(`/bookings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    // Изменение статуса
    async changeStatus(id: number, status: Booking['status']): Promise<Booking> {
        return this.request<Booking>(`/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // Удаление/отмена бронирования
    async remove(id: number): Promise<void> {
        const url = `${API_BASE_URL}/bookings/${id}`;
        const token = await tokenService.getToken();

        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log(`🗑️ DELETE booking ${id} - Status:`, response.status);

        if (!response.ok) {
            // Пытаемся получить сообщение об ошибке
            let errorMessage = `HTTP error! status: ${response.status}`;

            try {
                // Пытаемся прочитать JSON только если есть контент
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                }
            } catch (jsonError) {
                // Игнорируем ошибку парсинга JSON
                console.log('No JSON response for DELETE');
            }

            throw new Error(errorMessage);
        }

        // Если успешно, просто возвращаем void
        return;
    }

    // Проверка доступности
    async checkAvailability(
        listingId: number,
        startDate: Date,
        endDate: Date
    ): Promise<{ available: boolean }> {
        return this.request<{ available: boolean }>('/bookings/check-availability', {
            method: 'POST',
            body: JSON.stringify({
                listingId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            }),
        });
    }
}

export const bookingsApiService = new BookingsApiService();