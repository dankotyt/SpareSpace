import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdItem } from '@/types/main';

interface AdvertisementContextType {
    ads: AdItem[];
    addAdvertisement: (ad: Omit<AdItem, 'id'>) => void;
    refreshAds: () => void;
}

const AdvertisementContext = createContext<AdvertisementContextType | undefined>(undefined);

export const AdvertisementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ads, setAds] = useState<AdItem[]>([
        { id: '1', price: '8 000 ₽/мес.', type: 'Парковочное место', location: 'Ховрино Ховрино' },
        { id: '2', price: '350 ₽/сут.', type: 'Парковочное место', location: 'Зеленоград-Крюково' },
        { id: '3', price: '6 000 ₽/мес.', type: 'Кладовое помещение', location: 'Новокузнецкая' },
        { id: '4', price: '180 ₽/сут.', type: 'Кладовое помещение', location: 'Третьяковская' },
    ]);

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
        <AdvertisementContext.Provider value={{ ads, addAdvertisement, refreshAds }}>
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