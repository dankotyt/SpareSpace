import { ListingResponse } from '@/services/api/listingApi';

export type ListingType = 'PARKING' | 'STORAGE' | 'GARAGE';
export type PricePeriodType = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
export type CurrencyType = 'RUB';

export interface AdvertisementFormData {
    // Шаг 1: Тип объявления
    type: ListingType | null;

    // Шаг 2: Основная информация
    address: string;
    area: string;
    features: string[];
    location?: {
        latitude: number;
        longitude: number;
    };

    // Шаг 3: Фотографии и описание
    description: string;
    photos: string[]; // массив URL или base64 строк

    // Шаг 4: Цена и доступность
    price: {
        hourly?: string;
        daily?: string;
        weekly?: string;
        monthly?: string;
    };
    availability?: {
        start: string; // дата в формате YYYY-MM-DD
        end: string;
    }[];

    // Шаг 5: Контакты
    contacts?: {
        name: string;
        phone: string;
        email?: string;
    };
}

export interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
}

export type AdvertisementStep = 1 | 2 | 3 | 4 | 5;

export const createMainScreenAdFromResponse = (listing: ListingResponse) => {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'PARKING': return 'Парковочное место';
            case 'STORAGE': return 'Кладовое помещение';
            case 'GARAGE': return 'Гараж';
            default: return 'Помещение';
        }
    };

    const getPriceText = (price: number, period: string) => {
        const periodLabels = {
            HOUR: 'час',
            DAY: 'сутки',
            WEEK: 'неделя',
            MONTH: 'месяц'
        };

        const validPeriod = period as PricePeriodType;
        return `${price} ₽/${periodLabels[validPeriod] || 'период'}`;
    };

    return {
        id: listing.id,
        price: getPriceText(listing.price, listing.pricePeriod),
        type: getTypeLabel(listing.type),
        location: listing.address,
        image: listing.photosJson?.[0] || undefined,
        description: listing.description,
    };
};