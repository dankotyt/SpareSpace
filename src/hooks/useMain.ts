import { useState, useCallback, useEffect } from 'react';
import { CategoryItem } from '@/types/main';
import { mainApiService } from '@/services/api/mainApi';
import { formatListingForDisplay } from '@/shared/utils/priceFormatter';

const transformListingToAdItem = (listing: any) => {
    return {
        id: listing.id.toString(),
        price: listing.displayPrice,
        type: listing.displayType,
        location: listing.address,
        image: listing.photosJson && listing.photosJson.length > 0 ? listing.photosJson[0] : undefined,
        originalData: listing
    };
};

export const useMain = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories: CategoryItem[] = [
        { id: 'all', title: 'Все', type: 'OTHER' },
        { id: 'parking', title: 'Парковочное место', type: 'PARKING' },
        { id: 'garage', title: 'Гараж', type: 'GARAGE' },
        { id: 'storage', title: 'Кладовая', type: 'STORAGE' },
    ];

    const loadAds = useCallback(async (categoryType?: string) => {
        try {
            setLoading(true);
            let response;

            if (categoryType && categoryType !== 'OTHER') {
                response = await mainApiService.getListingsByType(categoryType);
            } else {
                response = await mainApiService.getListings({ limit: 20 });
            }

            const transformedAds = response.listings.map(transformListingToAdItem);
            setAds(transformedAds);
        } catch (error) {
            console.error('Error loading ads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCategorySelect = useCallback((categoryId: string) => {
        setSelectedCategory(categoryId);
        const category = categories.find(cat => cat.id === categoryId);
        loadAds(category?.type);
    }, [categories, loadAds]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadAds(selectedCategory === 'all' ? undefined : selectedCategory)
            .finally(() => setIsRefreshing(false));
    }, [selectedCategory, loadAds]);

    useEffect(() => {
        loadAds();
    }, [loadAds]);

    return {
        categories,
        ads,
        selectedCategory,
        isRefreshing: isRefreshing || loading,
        handleCategorySelect,
        handleRefresh,
    };
};