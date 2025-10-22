import { useState, useCallback } from 'react';
import { AdItem, CategoryItem } from '@/types/main';
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

    // const [ads, setAds] = useState<AdItem[]>([
    //     { id: '1', price: '8 000 ₽/мес.', type: 'Парковочное место', location: 'Ховрино Ховрино' },
    //     { id: '2', price: '350 ₽/сут.', type: 'Парковочное место', location: 'Зеленоград-Крюково' },
    //     { id: '3', price: '6 000 ₽/мес.', type: 'Кладовое помещение', location: 'Новокузнецкая' },
    //     { id: '4', price: '180 ₽/сут.', type: 'Кладовое помещение', location: 'Третьяковская' },
    //     { id: '5', price: '8 000 ₽/мес.', type: 'Парковочное место', location: 'Ховрино Ховрино' },
    //     { id: '6', price: '350 ₽/сут.', type: 'Парковочное место', location: 'Зеленоград-Крюково' },
    //     { id: '7', price: '6 000 ₽/мес.', type: 'Кладовое помещение', location: 'Новокузнецкая' },
    //     { id: '8', price: '180 ₽/сут.', type: 'Кладовое помещение', location: 'Третьяковская' },
    // ]);


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