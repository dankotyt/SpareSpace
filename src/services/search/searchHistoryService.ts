import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SearchHistoryItem {
    id: string;
    type: string;
    timestamp: number;
    label: string;
    pricePeriod?: string;
}

const SEARCH_HISTORY_KEY = 'search_history';

export const searchHistoryService = {
    async saveSearchHistory(history: SearchHistoryItem[]): Promise<void> {
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('❌ Ошибка сохранения истории поиска:', error);
        }
    },

    async loadSearchHistory(): Promise<SearchHistoryItem[]> {
        try {
            const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('❌ Ошибка загрузки истории поиска:', error);
            return [];
        }
    },

    async addToHistory(item: Omit<SearchHistoryItem, 'id'>): Promise<SearchHistoryItem[]> {
        const history = await this.loadSearchHistory();

        const newItem: SearchHistoryItem = {
            ...item,
            id: Date.now().toString()
        };

        const filteredHistory = history.filter(
            existingItem => !(existingItem.label === item.label && existingItem.type === item.type)
        );

        const newHistory = [newItem, ...filteredHistory].slice(0, 10);

        await this.saveSearchHistory(newHistory);
        return newHistory;
    },

    async removeFromHistory(id: string): Promise<SearchHistoryItem[]> {
        const history = await this.loadSearchHistory();
        const newHistory = history.filter(item => item.id !== id);
        await this.saveSearchHistory(newHistory);
        return newHistory;
    },

    async clearHistory(): Promise<void> {
        await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    }
};