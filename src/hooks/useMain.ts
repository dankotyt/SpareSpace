import { useState, useCallback } from 'react';
import { CategoryItem } from '@/types/main';
import { useAdvertisement } from '@/services/AdvertisementContext';

export const useMain = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { ads, refreshAds } = useAdvertisement();

    const categories: CategoryItem[] = [
        { id: '1', title: 'Парковочное место', type: 'parking' },
        { id: '2', title: 'Гараж', type: 'garage' },
        { id: '3', title: 'Кладовая', type: 'pantry' },
        { id: '4', title: 'Кладовая', type: 'pantry' },
    ];

    const handleCategorySelect = useCallback((categoryId: string) => {
        setSelectedCategory(categoryId);
    }, []);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => {
            refreshAds();
            setIsRefreshing(false);
        }, 1000);
    }, [refreshAds]);

    return {
        categories,
        ads,
        selectedCategory,
        isRefreshing,
        handleCategorySelect,
        handleRefresh,
    };
};