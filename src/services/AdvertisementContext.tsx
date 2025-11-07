import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AdItem } from '@/types/main';
import {listingApiService, ListingResponse} from "@services/api/listingApi";

interface AdvertisementContextType {
    ads: AdItem[];
    userAds: ListingResponse[];
    addAdvertisement: (ad: Omit<AdItem, 'id'>) => void;
    refreshAds: () => void;
    refreshUserAds: () => Promise<void>;
    loading: boolean;
}

const AdvertisementContext = createContext<AdvertisementContextType | undefined>(undefined);

export const AdvertisementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ads, setAds] = useState<AdItem[]>([
        { id: '1', price: '8 000 ₽/мес.', type: 'Парковочное место', location: 'Ховрино Ховрино' },
        { id: '2', price: '350 ₽/сут.', type: 'Парковочное место', location: 'Зеленоград-Крюково' },
        { id: '3', price: '6 000 ₽/мес.', type: 'Кладовое помещение', location: 'Новокузнецкая' },
        { id: '4', price: '180 ₽/сут.', type: 'Кладовое помещение', location: 'Третьяковская' },
    ]);

    const [userAds, setUserAds] = useState<ListingResponse[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshAllAds = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading all listings...');
            const listings = await listingApiService.getListings();
            console.log('📋 Loaded all listings:', listings);

            const transformedAds: AdItem[] = listings.map(listing => ({
                id: listing.id.toString(),
                price: `${listing.price} ₽`,
                type: getTypeText(listing.type),
                location: listing.address,
            }));

            setAds(transformedAds);
        } catch (error) {
            console.error('❌ Error loading all ads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const getTypeText = (type: string): string => {
        const typeMap: { [key: string]: string } = {
            'PARKING': 'Парковочное место',
            'GARAGE': 'Гараж',
            'STORAGE': 'Кладовое помещение',
            'OTHER': 'Другое'
        };
        return typeMap[type] || type;
    };

    const refreshUserAds = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading my listings...');
            const listings = await listingApiService.getMyListings();
            console.log('📋 Loaded my listings:', listings);
            setUserAds(listings);
        } catch (error) {
            console.error('❌ Error loading my ads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addAdvertisement = (adData: Omit<AdItem, 'id'>) => {
        const newAd: AdItem = {
            ...adData,
            id: Date.now().toString(),
        };
        setAds(prev => [newAd, ...prev]);
        console.log('Новое объявление добавлено:', newAd);
    };

    const refreshAds = () => {
        setAds(prev => {
            const shuffled = [...prev];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        });
    };

    return (
        <AdvertisementContext.Provider value={{
            ads,
            userAds,
            addAdvertisement,
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