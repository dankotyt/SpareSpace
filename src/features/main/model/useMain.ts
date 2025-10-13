import { useState, useCallback } from 'react';
import { AdItem, CategoryItem } from './types';

export const useMain = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories: CategoryItem[] = [
        { id: '1', title: 'Парковочное место', type: 'parking' },
        { id: '2', title: 'Гараж', type: 'garage' },
        { id: '3', title: 'Кладовая', type: 'pantry' },
        { id: '4', title: 'Кладовая', type: 'pantry' },
    ];

    const ads: AdItem[] = [
        { id: '1', price: '8 000 ₽/мес.', type: 'Парковочное место', location: 'Ховрино Ховрино' },
        { id: '2', price: '350 ₽/сут.', type: 'Парковочное место', location: 'Зеленоград-Крюково' },
        { id: '3', price: '6 000 ₽/мес.', type: 'Кладовое помещение', location: 'Новокузнецкая' },
        { id: '4', price: '180 ₽/сут.', type: 'Кладовое помещение', location: 'Третьяковская' },
    ];

    const handleCategorySelect = useCallback((categoryId: string) => {
        setSelectedCategory(categoryId);
    }, []);

    return {
        categories,
        ads,
        selectedCategory,
        handleCategorySelect,
    };
};