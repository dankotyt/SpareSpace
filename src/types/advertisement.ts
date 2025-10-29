export type ListingType = 'parking' | 'pantry' | 'garage';
export type PricePeriodType = 'hour' | 'day' | 'week' | 'month';
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
        startDate: string; // дата в формате YYYY-MM-DD
        endDate: string;
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
    price_period: PricePeriodType;
    currency: CurrencyType;
    latitude?: number;
    longitude?: number;
    address: string;
    size?: number;
    photos_json: string[];
    amenities: Record<string, boolean>;
    availability: AvailabilityPeriod[];
}

export interface ListingResponse {
    id: number;
    type: ListingType;
    title: string;
    description: string;
    price: number;
    price_period: PricePeriodType;
    currency: CurrencyType;
    address: string;
    size?: number;
    photos_json: string[];
    amenities: Record<string, boolean>;
    availability: AvailabilityPeriod[];
    user_id: number;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    updated_at: string;
}

export type AdvertisementStep = 1 | 2 | 3 | 4 | 5;

export const transformFormDataToApi = (formData: AdvertisementFormData): CreateListingRequest => {
    if (!formData.type) {
        throw new Error('Тип объявления не выбран');
    }

    let mainPrice = 0;
    let pricePeriod: PricePeriodType = 'month';

    if (formData.price.monthly && formData.price.monthly !== '') {
        mainPrice = parseFloat(formData.price.monthly);
        pricePeriod = 'month';
    } else if (formData.price.weekly && formData.price.weekly !== '') {
        mainPrice = parseFloat(formData.price.weekly);
        pricePeriod = 'week';
    } else if (formData.price.daily && formData.price.daily !== '') {
        mainPrice = parseFloat(formData.price.daily);
        pricePeriod = 'day';
    } else if (formData.price.hourly && formData.price.hourly !== '') {
        mainPrice = parseFloat(formData.price.hourly);
        pricePeriod = 'hour';
    } else {
        throw new Error('Не указана цена аренды');
    }

    const typeTitles = {
        parking: 'Парковочное место',
        pantry: 'Кладовое помещение',
        garage: 'Гараж'
    };

    const title = `${typeTitles[formData.type]} - ${formData.address}`;

    const amenities = formData.features.reduce((acc, feature) => {
        acc[feature] = true;
        return acc;
    }, {} as Record<string, boolean>);

    const availability = formData.availability ? [{
        start: `${formData.availability.startDate}T00:00:00.000Z`,
        end: `${formData.availability.endDate}T23:59:59.999Z`
    }] : [];

    const size = formData.area ? parseFloat(formData.area) : undefined;

    return {
        type: formData.type,
        title,
        description: formData.description,
        price: mainPrice,
        price_period: pricePeriod,
        currency: 'RUB',
        address: formData.address,
        size,
        photos_json: formData.photos,
        amenities,
        availability,
    };
};

export const createMainScreenAdFromResponse = (listing: ListingResponse) => {
    const getTypeLabel = (type: ListingType) => {
        switch (type) {
            case 'parking': return 'Парковочное место';
            case 'pantry': return 'Кладовое помещение';
            case 'garage': return 'Гараж';
            default: return 'Помещение';
        }
    };

    const getPriceText = (price: number, period: PricePeriodType) => {
        const periodLabels = {
            hour: 'час',
            day: 'сутки',
            week: 'неделя',
            month: 'месяц'
        };

        return `${price} ₽/${periodLabels[period]}`;
    };

    return {
        id: listing.id,
        price: getPriceText(listing.price, listing.price_period),
        type: getTypeLabel(listing.type),
        location: listing.address,
        image: listing.photos_json?.[0] || undefined,
        description: listing.description,
    };
};