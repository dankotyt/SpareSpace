import {useCallback, useState} from 'react';
import {CreateListingRequest, listingApiService} from '@/services/api/listingApi';
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

        const amenities: Record<string, string> = {};
        if (formData.features && Array.isArray(formData.features)) {
            formData.features.forEach(feature => {
                amenities[feature] = 'true';
            });
        }

        const availability: Array<{
            start: string;
            end: string;
        }> = [];

        if (formData.availability && Array.isArray(formData.availability) && formData.availability.length > 0) {
            const firstAvailability = formData.availability[0];

            console.log('🔍 Processing availability:', firstAvailability);

            try {
                const start = parseDateSafely(firstAvailability.start);
                const end = parseDateSafely(firstAvailability.end);

                console.log('✅ Parsed dates - start:', start, 'end:', end);

                if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
                    throw new Error('Неверные даты доступности');
                }

                if (start >= end) {
                    throw new Error('Дата начала должна быть раньше даты окончания');
                }

                availability.push({
                    start: start.toISOString(),
                    end: end.toISOString(),
                });

            } catch (error) {
                console.error('❌ Error parsing availability:', error);
                throw error;
            }
        }

        const size = formData.area ? parseFloat(formData.area) : undefined;

        const location = formData.location ? {
            longitude: formData.location.longitude,
            latitude: formData.location.latitude
        } : undefined;

        const photoUrls = formData.photos;

        return {
            type: formData.type,
            title,
            description: formData.description || '',
            price: mainPrice,
            pricePeriod: pricePeriod,
            currency: 'RUB',
            location: location,
            address: formData.address,
            size,
            photoUrls: photoUrls,
            amenities: Object.keys(amenities).length > 0 ? amenities : undefined,
            availability: availability,
        };
    };

    const parseDateSafely = (dateValue: any): Date => {
        console.log('🔍 Parsing date value:', dateValue, 'type:', typeof dateValue);

        if (dateValue instanceof Date) {
            if (!isNaN(dateValue.getTime())) {
                return dateValue;
            } else {
                throw new Error('Invalid Date object');
            }
        }

        if (typeof dateValue === 'number' && !isNaN(dateValue)) {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        if (typeof dateValue === 'string') {
            const trimmedString = dateValue.trim();
            if (trimmedString === '') {
                throw new Error('Пустая строка с датой');
            }

            const date = new Date(trimmedString);
            if (!isNaN(date.getTime())) {
                return date;
            }

            const dateOnly = new Date(trimmedString + 'T00:00:00.000Z');
            if (!isNaN(dateOnly.getTime())) {
                return dateOnly;
            }
        }

        console.error('❌ Invalid date value:', dateValue);
        throw new Error(`Неверный формат даты: ${dateValue}`);
    };

    const createListing = useCallback(async (formData: any) => {
        if (!formData.type) {
            throw new Error('Тип объявления не выбран');
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('📤 Исходные данные формы:', formData);
            const apiData = transformFormDataToApi(formData);
            console.log('📦 Данные для отправки в API:', JSON.stringify(apiData, null, 2));
            return await listingApiService.createListing(apiData);
        } catch (err: any) {
            console.error('❌ Ошибка при создании объявления:', err);
            const errorMessage = err.message || 'Произошла ошибка при создании объявления';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

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