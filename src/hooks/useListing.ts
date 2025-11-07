import { useState, useCallback } from 'react';
import { listingApiService, CreateListingRequest } from '@/services/api/listingApi';
import {AdvertisementFormData, PricePeriodType} from '@/types/advertisement';

export const useListing = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const transformFormDataToApi = (formData: AdvertisementFormData): CreateListingRequest => {
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
            start: formData.availability.start,
            end: formData.availability.end,
        }] : [];

        const size = formData.area ? parseFloat(formData.area) : undefined;
        const latitude = formData.location?.latitude;
        const longitude = formData.location?.longitude;

        return {
            type: formData.type,
            title,
            description: formData.description,
            price: mainPrice,
            pricePeriod: pricePeriod,
            currency: 'RUB',
            latitude: latitude,
            longitude: longitude,
            address: formData.address,
            size,
            photosJson: formData.photos,
            amenities,
            availability,
        };
    };

    const createListing = useCallback(async (formData: AdvertisementFormData) => {
        if (!formData.type) {
            throw new Error('Тип объявления не выбран');
        }

        setIsLoading(true);
        setError(null);

        try {
            const apiData = transformFormDataToApi(formData);
            console.log('Отправка данных на сервер:', apiData);

            const result = await listingApiService.createListing(apiData);
            console.log('Объявление успешно создано:', result);

            return result;
        } catch (err: any) {
            console.error('Ошибка при создании объявления:', err);
            const errorMessage = err.message || 'Произошла ошибка при создании объявления';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [transformFormDataToApi]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        createListing,
        isLoading,
        error,
        clearError,
    };
};