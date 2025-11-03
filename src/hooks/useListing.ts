import { useState, useCallback } from 'react';
import { listingApiService, CreateListingRequest } from '@/services/api/listingApi';
import { AdvertisementFormData } from '@/types/advertisement';

export const useListing = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const transformFormDataToApi = useCallback((formData: AdvertisementFormData): CreateListingRequest => {
        let mainPrice = 0;
        let pricePeriod: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' = 'MONTH';

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
        }

        const amenities = formData.features.reduce((acc, feature) => {
            acc[feature] = true;
            return acc;
        }, {} as any);

        const availability = formData.availability ? [{
            start: formData.availability.start,
            end: formData.availability.end,
        }] : [];

        return {
            type: formData.type!,
            title: `${formData.type === 'PARKING' ? 'Парковочное место' :
                formData.type === 'STORAGE' ? 'Кладовка' : 'Гараж'} - ${formData.address}`,
            description: formData.description,
            price: mainPrice,
            pricePeriod: pricePeriod,
            currency: 'RUB' as const,
            address: formData.address,
            size: formData.area ? parseFloat(formData.area) : undefined,
            photosJson: formData.photos,
            amenities,
            availability,
        };
    }, []);

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