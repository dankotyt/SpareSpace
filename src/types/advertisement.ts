export type ListingType = 'PARKING' | 'STORAGE' | 'GARAGE';
export type PricePeriodType = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
export type CurrencyType = 'RUB';

export interface AvailabilityPeriod {
    start: string; // ISO string format
    end: string;
}

export interface AdvertisementFormData {
    // Шаг 1: Тип объявления
    type: ListingType | null;

    // Шаг 2: Основная информация
    address: string;
    area: string;
    features: string[];

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
    };

    // Шаг 5: Контакты
    contacts?: {
        name: string;
        phone: string;
        email?: string;
    };
}

export interface CreateListingRequest {
    type: ListingType;
    title: string;
    description: string;
    price: number;
    pricePeriod: PricePeriodType;
    currency: CurrencyType;
    latitude?: number;
    longitude?: number;
    address: string;
    size?: number;
    photosJson: string[];
    amenities: Record<string, boolean>;
    availability: AvailabilityPeriod[];
}

export interface ListingResponse {
    id: number;
    type: ListingType;
    title: string;
    description: string;
    price: number;
    pricePeriod: PricePeriodType;
    currency: CurrencyType;
    address: string;
    size?: number;
    photosJson: string[];
    amenities: Record<string, boolean>;
    availability: AvailabilityPeriod[];
    userId: number;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'DRAFT' | 'REJECTED' | 'RENTED';
    createdAt: string;
    updatedAt: string;
}

export type AdvertisementStep = 1 | 2 | 3 | 4 | 5;

export const transformFormDataToApi = (formData: AdvertisementFormData): CreateListingRequest => {
    if (!formData.type) {
        throw new Error('Тип объявления не выбран');
    }

    let mainPrice = 0;
    let pricePeriod: PricePeriodType = 'MONTH';

    if (formData.price.monthly && formData.price.monthly !== '') {
        mainPrice = parseFloat(formData.price.monthly);
        pricePeriod = 'MONTH';
    } else if (formData.price.weekly && formData.price.weekly !== '') {
        mainPrice = parseFloat(formData.price.weekly);
        pricePeriod = 'WEEK';
    } else if (formData.price.daily && formData.price.daily !== '') {
        mainPrice = parseFloat(formData.price.daily);
        pricePeriod = 'DAY';
    } else if (formData.price.hourly && formData.price.hourly !== '') {
        mainPrice = parseFloat(formData.price.hourly);
        pricePeriod = 'HOUR';
    } else {
        throw new Error('Не указана цена аренды');
    }

    const typeTitles = {
        PARKING: 'Парковочное место',
        STORAGE: 'Кладовое помещение',
        GARAGE: 'Гараж'
    };

    const title = `${typeTitles[formData.type]} - ${formData.address}`;

    const amenities = formData.features.reduce((acc, feature) => {
        acc[feature] = true;
        return acc;
    }, {} as Record<string, boolean>);

    const availability = formData.availability ? [{
        start: `${formData.availability.start}T00:00:00.000Z`,
        end: `${formData.availability.end}T23:59:59.999Z`
    }] : [];

    const size = formData.area ? parseFloat(formData.area) : undefined;

    return {
        type: formData.type,
        title,
        description: formData.description,
        price: mainPrice,
        pricePeriod: pricePeriod,
        currency: 'RUB',
        address: formData.address,
        size,
        photosJson: formData.photos,
        amenities,
        availability,
    };
};

export const createMainScreenAdFromResponse = (listing: ListingResponse) => {
    const getTypeLabel = (type: ListingType) => {
        switch (type) {
            case 'PARKING': return 'Парковочное место';
            case 'STORAGE': return 'Кладовое помещение';
            case 'GARAGE': return 'Гараж';
            default: return 'Помещение';
        }
    };

    const getPriceText = (price: number, period: PricePeriodType) => {
        const periodLabels = {
            HOUR: 'час',
            DAY: 'сутки',
            WEEK: 'неделя',
            MONTH: 'месяц'
        };

        return `${price} ₽/${periodLabels[period]}`;
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