import {listingApiService} from './listingApi';

/**
 * DTO для поиска объявлений с фильтрами
 */
export interface SearchListingsDto {
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    pricePeriod?: string;
    currency?: string;
    limit?: number;
    offset?: number;
}

/**
 * Сервис для работы с главным API приложения
 * Предоставляет агрегированные методы для работы с объявлениями на главной странице
 */
class MainApiService {

    /**
     * Получает список объявлений с возможностью фильтрации и пагинации
     * @param searchParams - параметры поиска и фильтрации
     * @returns Промис с отфильтрованными объявлениями и общим количеством
     */
    async getListings(searchParams?: SearchListingsDto): Promise<{ listings: any[]; total: number }> {
        try {
            let filteredListings = await listingApiService.getListings();

            if (searchParams?.type) {
                filteredListings = filteredListings.filter(listing =>
                    listing.type === searchParams.type
                );
            }

            if (searchParams?.limit) {
                const offset = searchParams.offset || 0;
                filteredListings = filteredListings.slice(offset, offset + searchParams.limit);
            }

            return {
                listings: filteredListings,
                total: filteredListings.length
            };
        } catch (error) {
            console.error('Error getting listings in mainApi:', error);
            return { listings: [], total: 0 };
        }
    }

    /**
     * Получает объявления по типу (парковка, гараж, кладовая)
     * @param type - тип объявления для фильтрации
     * @returns Промис с отфильтрованными объявлениями
     */
    async getListingsByType(type: string): Promise<{ listings: any[]; total: number }> {
        return this.getListings({ type, limit: 20 });
    }
}

export const mainApiService = new MainApiService();