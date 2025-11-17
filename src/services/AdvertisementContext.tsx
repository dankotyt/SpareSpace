import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AdItem } from '@/types/main';
import { listingApiService, ListingResponse } from "@services/api/listingApi";

interface AdvertisementContextType {
    ads: AdItem[];
    userAds: ListingResponse[];
    refreshAds: () => Promise<void>;
    refreshUserAds: () => Promise<void>;
    loading: boolean;
}

const AdvertisementContext = createContext<AdvertisementContextType | undefined>(undefined);

export const AdvertisementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ads, setAds] = useState<AdItem[]>([]); // ТОЛЬКО реальные данные
    const [userAds, setUserAds] = useState<ListingResponse[]>([]); // ТОЛЬКО реальные данные
    const [loading, setLoading] = useState(false);

    const getTypeText = (type: string): string => {
        const typeMap: { [key: string]: string } = {
            'PARKING': 'Парковочное место',
            'GARAGE': 'Гараж',
            'STORAGE': 'Кладовое помещение',
            'OTHER': 'Другое'
        };
        return typeMap[type] || type;
    };

    const refreshAds = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading all listings from API...');
            const listings = await listingApiService.getListings();
            console.log('📋 Loaded listings from API:', listings);

            const transformedAds: AdItem[] = listings.map(listing => ({
                id: listing.id.toString(),
                price: `${Math.round(listing.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽${
                    listing.pricePeriod === 'HOUR' ? '/час' :
                        listing.pricePeriod === 'DAY' ? '/день' :
                            listing.pricePeriod === 'WEEK' ? '/неделя' :
                                listing.pricePeriod === 'MONTH' ? '/месяц' : ''
                }`,
                type: getTypeText(listing.type),
                location: listing.address,
                image: listing.photosJson?.[0],
                originalData: listing
            }));

            setAds(transformedAds);
        } catch (error) {
            console.error('❌ Error loading ads from API:', error);
            setAds([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshUserAds = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading my listings from API...');
            const listings = await listingApiService.getMyListings();
            console.log('📋 Loaded my listings from API:', listings);
            setUserAds(listings);
        } catch (error) {
            console.error('❌ Error loading my ads from API:', error);
            setUserAds([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        refreshAds();
    }, []);

    return (
        <AdvertisementContext.Provider value={{
            ads,
            userAds,
            refreshAds,
            refreshUserAds,
            loading
        }}>
            {children}
        </AdvertisementContext.Provider>
    );
};

export const useAdvertisement = () => {
    const context = useContext(AdvertisementContext);
    if (context === undefined) {
        throw new Error('useAdvertisement must be used within an AdvertisementProvider');
    }
    return context;
};