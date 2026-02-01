import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listing } from '@/types/profile';
import { SearchHistoryItem } from '@/services/search/searchHistoryService';

/**
 * Интерфейс избранного объявления
 */
export interface FavoriteListing {
    id: string;
    type: 'listing';
    data: Listing;
    addedAt: number;
}

/**
 * Интерфейс избранного поискового запроса
 */
export interface FavoriteSearch {
    id: string;
    type: 'search';
    data: SearchHistoryItem;
    addedAt: number;
}

/**
 * Интерфейс избранного поискового запроса
 */
export interface FavoriteCollection {
    id: string;
    type: 'collection';
    title: string;
    description?: string;
    items: Array<FavoriteListing | FavoriteSearch>;
    createdAt: number;
}

/**
 * Тип объединения всех видов избранного
 */
export type FavoriteItem = FavoriteListing | FavoriteSearch | FavoriteCollection;

const FAVORITES_KEY = 'user_favorites';

/**
 * Сервис управления избранными элементами пользователя
 * Предоставляет CRUD операции для объявлений, поисковых запросов и коллекций
 */
export const favoritesService = {

    /**
     * Загружает все избранные элементы пользователя
     * @returns Промис с массивом избранных элементов
     */
    async loadFavorites(): Promise<FavoriteItem[]> {
        try {
            const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('❌ Ошибка загрузки избранного:', error);
            return [];
        }
    },

    /**
     * Сохраняет массив избранных элементов в хранилище
     * @param favorites - массив избранных элементов для сохранения
     */
    async saveFavorites(favorites: FavoriteItem[]): Promise<void> {
        try {
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('❌ Ошибка сохранения избранного:', error);
        }
    },

    /**
     * Добавляет объявление в избранное
     * @param listing - объект объявления для добавления
     * @returns Промис с обновленным массивом избранного
     */
    async addListing(listing: Listing): Promise<FavoriteItem[]> {
        const favorites = await this.loadFavorites();

        const existingIndex = favorites.findIndex(
            item => item.type === 'listing' && item.data.id === listing.id
        );

        if (existingIndex !== -1) {
            return favorites;
        }

        const newFavorite: FavoriteListing = {
            id: `listing_${listing.id}_${Date.now()}`,
            type: 'listing',
            data: listing,
            addedAt: Date.now(),
        };

        const newFavorites = [newFavorite, ...favorites];
        await this.saveFavorites(newFavorites);
        return newFavorites;
    },

    /**
     * Добавляет поисковый запрос в избранное
     * @param search - объект поискового запроса
     * @returns Промис с обновленным массивом избранного
     */
    async addSearch(search: SearchHistoryItem): Promise<FavoriteItem[]> {
        const favorites = await this.loadFavorites();

        const newFavorite: FavoriteSearch = {
            id: `search_${search.id}_${Date.now()}`,
            type: 'search',
            data: search,
            addedAt: Date.now(),
        };

        const newFavorites = [newFavorite, ...favorites];
        await this.saveFavorites(newFavorites);
        return newFavorites;
    },

    /**
     * Создает новую коллекцию в избранном
     * @param title - название коллекции
     * @param description - описание коллекции (опционально)
     * @returns Промис с обновленным массивом избранного
     */
    async createCollection(title: string, description?: string): Promise<FavoriteItem[]> {
        const favorites = await this.loadFavorites();

        const newCollection: FavoriteCollection = {
            id: `collection_${Date.now()}`,
            type: 'collection',
            title,
            description,
            items: [],
            createdAt: Date.now(),
        };

        const newFavorites = [newCollection, ...favorites];
        await this.saveFavorites(newFavorites);
        return newFavorites;
    },

    /**
     * Добавляет элемент в существующую коллекцию
     * @param collectionId - ID коллекции
     * @param item - элемент для добавления (объявление или поиск)
     * @returns Промис с обновленным массивом избранного
     */
    async addToCollection(collectionId: string, item: FavoriteListing | FavoriteSearch): Promise<FavoriteItem[]> {
        const favorites = await this.loadFavorites();

        const updatedFavorites = favorites.map(fav => {
            if (fav.type === 'collection' && fav.id === collectionId) {
                const exists = fav.items.some(existingItem =>
                    existingItem.id === item.id
                );

                if (!exists) {
                    return {
                        ...fav,
                        items: [...fav.items, item],
                    };
                }
            }
            return fav;
        });

        await this.saveFavorites(updatedFavorites);
        return updatedFavorites;
    },

    /**
     * Удаляет элемент из избранного по ID
     * @param id - ID элемента для удаления
     * @returns Промис с обновленным массивом избранного
     */
    async removeFavorite(id: string): Promise<FavoriteItem[]> {
        const favorites = await this.loadFavorites();
        const newFavorites = favorites.filter(item => item.id !== id);
        await this.saveFavorites(newFavorites);
        return newFavorites;
    },

    /**
     * Проверяет, находится ли объявление в избранном
     * @param listingId - ID объявления
     * @returns Промис с булевым значением наличия в избранном
     */
    async isListingFavorite(listingId: number): Promise<boolean> {
        const favorites = await this.loadFavorites();
        return favorites.some(
            item => item.type === 'listing' && item.data.id === listingId
        );
    },

    /**
     * Получает все избранные объявления
     * @returns Промис с массивом избранных объявлений
     */
    async getFavoriteListings(): Promise<FavoriteListing[]> {
        const favorites = await this.loadFavorites();
        return favorites.filter(
            (item): item is FavoriteListing => item.type === 'listing'
        );
    },

    /**
     * Получает все избранные поисковые запросы
     * @returns Промис с массивом избранных поисков
     */
    async getFavoriteSearches(): Promise<FavoriteSearch[]> {
        const favorites = await this.loadFavorites();
        return favorites.filter(
            (item): item is FavoriteSearch => item.type === 'search'
        );
    },

    /**
     * Получает все коллекции избранного
     * @returns Промис с массивом коллекций
     */
    async getCollections(): Promise<FavoriteCollection[]> {
        const favorites = await this.loadFavorites();
        return favorites.filter(
            (item): item is FavoriteCollection => item.type === 'collection'
        );
    },
};