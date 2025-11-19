import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listing } from '@/types/profile';
import { SearchHistoryItem } from '@/services/search/searchHistoryService';

export interface FavoriteListing {
    id: string;
    type: 'listing';
    data: Listing;
    addedAt: number;
}

export interface FavoriteSearch {
    id: string;
    type: 'search';
    data: SearchHistoryItem;
    addedAt: number;
}

export interface FavoriteCollection {
    id: string;
    type: 'collection';
    title: string;
    description?: string;
    items: Array<FavoriteListing | FavoriteSearch>;
    createdAt: number;
}

export type FavoriteItem = FavoriteListing | FavoriteSearch | FavoriteCollection;

const FAVORITES_KEY = 'user_favorites';

export const favoritesService = {
    async loadFavorites(): Promise<FavoriteItem[]> {
        try {
            const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('❌ Ошибка загрузки избранного:', error);
            return [];
        }
    },

    async saveFavorites(favorites: FavoriteItem[]): Promise<void> {
        try {
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('❌ Ошибка сохранения избранного:', error);
        }
    },

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

    async removeFavorite(id: string): Promise<FavoriteItem[]> {
        const favorites = await this.loadFavorites();
        const newFavorites = favorites.filter(item => item.id !== id);
        await this.saveFavorites(newFavorites);
        return newFavorites;
    },

    async isListingFavorite(listingId: number): Promise<boolean> {
        const favorites = await this.loadFavorites();
        return favorites.some(
            item => item.type === 'listing' && item.data.id === listingId
        );
    },

    async getFavoriteListings(): Promise<FavoriteListing[]> {
        const favorites = await this.loadFavorites();
        return favorites.filter(
            (item): item is FavoriteListing => item.type === 'listing'
        );
    },

    async getFavoriteSearches(): Promise<FavoriteSearch[]> {
        const favorites = await this.loadFavorites();
        return favorites.filter(
            (item): item is FavoriteSearch => item.type === 'search'
        );
    },

    async getCollections(): Promise<FavoriteCollection[]> {
        const favorites = await this.loadFavorites();
        return favorites.filter(
            (item): item is FavoriteCollection => item.type === 'collection'
        );
    },
};