export interface AdvertisementFormData {
    // Шаг 1: Тип объявления
    type: 'parking' | 'pantry' | 'garage' | null;

    // Шаг 2: Основная информация
    address: string;
    area: string;
    features: string[];

    // Шаг 3: Фотографии и описание
    description: string;
    photos: string[];

    // Шаг 4: Цена и доступность
    price: {
        daily?: string;
        weekly?: string;
        monthly?: string;
    };
    availability?: {
        startDate: string;
        endDate: string;
    };

    // Шаг 5: Контакты
    contacts?: {
        name: string;
        phone: string;
        email?: string;
    };
}

export type AdvertisementStep = 1 | 2 | 3 | 4 | 5;