import {tokenService} from '@/services/tokenService';
import {API_BASE_URL} from '@/config/env';
import {Listing} from "@/types/profile";
import {authApiService} from "@services/api/authApi";
import {formatListingForDisplay} from '@shared/utils/listingFormatter';

/**
 * Интерфейс запроса для создания объявления
 */
export interface CreateListingRequest {
    type: string;
    title: string;
    description: string;
    price: number;
    pricePeriod: string;
    currency: string;
    location?: {
        longitude: number;
        latitude: number;
    };
    address: string;
    size?: number;
    photoUrls?: string[];
    amenities?: Record<string, string>;
    availability: Array<{
        start: string;
        end: string;
    }>;
}

/**
 * Тип ответа API для объявления
 */
export type ListingResponse = Listing;

/**
 * Сервис для работы с API объявлений (листингов)
 * Предоставляет операции CRUD для парковочных мест, гаражей и кладовых
 */
class ListingApiService {

    /**
     * Авторизованный метод для выполнения авторизованных HTTP запросов
     * @param endpoint - конечная точка API
     * @param options - опции запроса fetch
     * @returns Промис с данными ответа
     * @throws Error при отсутствии токена или ошибке сервера
     */
    private async authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    /**
     * Метод для публичных запросов (без авторизации)
     */
    private async publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
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

    /**
     * Создает новое объявление (парковочное место, гараж или кладовую)
     * @param listingData - данные для создания объявления
     * @returns Промис с созданным объявлением в формате для отображения
     */
    async createListing(listingData: CreateListingRequest): Promise<ListingResponse> {
        const result = await this.authRequest<ListingResponse>('/listings', {
            method: 'POST',
            body: JSON.stringify(listingData),
        });
        return formatListingForDisplay(result);
    }

    /**
     * Получает список всех объявлений
     * @returns Промис с массивом объявлений в формате для отображения
     */
    async getListings(): Promise<ListingResponse[]> {
        try {
            const url = `${API_BASE_URL}/listings`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const listings = data.listings || [];
            return listings.map(formatListingForDisplay);

        } catch (error) {
            const response = await this.publicRequest<{ listings: ListingResponse[] }>('/listings');
            const listings = response.listings || [];
            return listings.map(formatListingForDisplay);
        }
    }

    /**
     * Получает объявления текущего пользователя
     * @returns Промис с массивом объявлений пользователя
     */
    async getMyListings(): Promise<ListingResponse[]> {
        try {
            const profileResponse = await authApiService.getProfile();
            if (profileResponse.success && profileResponse.data) {
                const userId = profileResponse.data.id;

                const response = await this.authRequest<{ listings: ListingResponse[] }>(`/listings/user/${userId}`);
                const listings = response.listings || [];

                return listings.map(formatListingForDisplay);
            }
            console.log('❌ No profile data');
            return [];
        } catch (error) {
            console.error('Error getting my listings:', error);
            return [];
        }
    }

    /**
     * Получает конкретное объявление по ID
     * @param id - ID объявления
     * @returns Промис с данными объявления в формате для отображения
     */
    async getListingById(id: number): Promise<ListingResponse> {
        const listing = await this.publicRequest<ListingResponse>(`/listings/${id}`);

        return formatListingForDisplay(listing);
    }

    /**
     * Обновляет существующее объявление
     * @param id - ID объявления для обновления
     * @param listingData - частичные данные для обновления
     * @returns Промис с обновленным объявлением
     */
    async updateListing(id: number, listingData: Partial<CreateListingRequest>): Promise<ListingResponse> {
        const listing = await this.authRequest<ListingResponse>(`/listings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(listingData),
        });

        return formatListingForDisplay(listing);
    }

    /**
     * Удаляет объявление
     * @param id - ID объявления для удаления
     */
    async deleteListing(id: number): Promise<void> {
        await this.authRequest(`/listings/${id}`, {
            method: 'DELETE',
        });
    }
}

export const listingApiService = new ListingApiService();