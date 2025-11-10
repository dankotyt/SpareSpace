import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Alert} from 'react-native';
import { TypeStep } from '@/components/addAdvertisement/TypeStep';
import { BasicInfoStep } from '@/components/addAdvertisement/BasicInfoStep';
import { PhotosStep } from '@/components/addAdvertisement/PhotosStep';
import { PriceStep } from '@/components/addAdvertisement/PriceStep';
import { PublishStep } from '@/components/addAdvertisement/PublishStep';
import { BackButton } from '@/components/ui/BackButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AdvertisementFormData, AdvertisementStep } from '@/types/advertisement';
import { COLORS } from '@/shared/constants/colors';
import {useNavigation, useRoute} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "@/navigation/types";
import { useAdvertisement } from '@/services/AdvertisementContext';
import { formatPrice } from '@/shared/utils/priceFormatter';
import { useListing } from '@/hooks/useListing';
import {useProfile} from "@hooks/useProfile";

export const AddAdvertisementScreen: React.FC = () => {
    const { addAdvertisement } = useAdvertisement();
    const { createListing, isLoading: isCreating, error: createError } = useListing();
    const { loadProfile } = useProfile();
    const route = useRoute();
    const params = route.params as any;
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [currentStep, setCurrentStep] = useState<AdvertisementStep>(params?.currentStep || 1);
    const [formData, setFormData] = useState<AdvertisementFormData>({
        type: null,
        address: '',
        area: '',
        features: [],
        location: undefined,
        description: '',
        photos: [],
        price: {},

    });

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            const params = route.params as any;
            if (params?.selectedLocation) {
                const { selectedLocation } = params;
                setFormData(prev => ({
                    ...prev,
                    location: {
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude
                    },
                    address: selectedLocation.address
                }));
                navigation.setParams({ selectedLocation: undefined });
            }
        });

        return unsubscribe;
    }, [navigation, route.params]);

    const handleTypeSelect = (type: 'PARKING' | 'STORAGE' | 'GARAGE') => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleAddressChange = (address: string) => {
        setFormData(prev => ({ ...prev, address }));
    };

    const handleAreaChange = (area: string) => {
        setFormData(prev => ({ ...prev, area }));
    };

    const handleFeaturesChange = (features: string[]) => {
        setFormData(prev => ({ ...prev, features }));
    };

    const handleDescriptionChange = (description: string) => {
        setFormData(prev => ({ ...prev, description }));
    };

    const handlePhotosChange = (photos: string[]) => {
        setFormData(prev => ({ ...prev, photos }));
    };

    const handlePriceChange = (price: any) => {
        setFormData(prev => ({ ...prev, price }));
    };

    const handleLocationSelect = (locationData: {
        latitude: number;
        longitude: number;
        address: string;
    }) => {
        setFormData(prev => ({
            ...prev,
            location: {
                latitude: locationData.latitude,
                longitude: locationData.longitude
            },
            address: locationData.address
        }));
    };

    const handleAvailabilityChange = (availability: { start: string; end: string }[] | undefined) => {
        console.log('Received availability from child:', availability);

        setFormData(prev => ({
            ...prev,
            availability: availability
        }));
    };

    const handleNext = () => {

        switch (currentStep) {
            case 1:
                console.log(`- Тип: ${formData.type}`);
                break;
            case 2:
                console.log(`- Адрес: ${formData.address}`);
                console.log(`- Площадь: ${formData.area}`);
                console.log(`- Особенности: ${formData.features.join(', ')}`);
                break;
            case 3:
                console.log(`- Описание: ${formData.description}`);
                console.log(`- Количество фото: ${formData.photos?.length || 0}`);
                break;
            case 4:
                console.log(`- Цены:`, formData.price);
                if (formData.availability && formData.availability.length > 0) {
                    const firstAvailability = formData.availability[0];
                    console.log(`- Период аренды: ${firstAvailability.start} - ${firstAvailability.end}`);
                } else {
                    console.log(`- Период аренды: не выбран`);
                }
                break;
            case 5:
                console.log('[Финальные данные]', JSON.stringify(formData, null, 2));
                return;
        }

        if (currentStep < 5) {
            console.log(`[Навигация] Переход с шага ${currentStep} на шаг ${currentStep + 1}`);
            setCurrentStep(prev => (prev + 1) as AdvertisementStep);
        } else {
            console.log('Публикуем объявление:', formData);
        }
    };

    const publishAdvertisement = async () => {
        try {
            console.log('Данные для отправки:', JSON.stringify(formData, null, 2));

            const listingData = {
                ...formData,
                availability: formData.availability && formData.availability.length > 0
                    ? formData.availability.map(avail => ({
                        start: new Date(avail.start),
                        end: new Date(avail.end)
                    }))
                    : undefined
            };

            const result = await createListing(listingData);

            console.log('Объявление успешно опубликовано!', result);

            await loadProfile();

            const mainScreenAd = createMainScreenAd(formData);
            addAdvertisement(mainScreenAd);

            Alert.alert(
                'Успех!',
                'Ваше объявление успешно опубликовано',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.goBack();
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('Ошибка при публикации:', error);

            const errorMessage = error.message || 'Не удалось опубликовать объявление';
            Alert.alert('Ошибка публикации', errorMessage);
        }
    };

    const createMainScreenAd = (formData: AdvertisementFormData) => {
        const getTypeLabel = (type: string) => {
            switch (type) {
                case 'PARKING': return 'Парковочное место';
                case 'STORAGE': return 'Кладовое помещение';
                case 'GARAGE': return 'Гараж';
                default: return 'Помещение';
            }
        };

        const getPriceText = () => {
            if (formData.price?.hourly && formData.price.hourly !== '') {
                return `${formatPrice(formData.price.hourly)} ₽/час`;
            }
            if (formData.price?.daily && formData.price.daily !== '') {
                return `${formatPrice(formData.price.daily)} ₽/сут.`;
            }
            if (formData.price?.weekly && formData.price.weekly !== '') {
                return `${formatPrice(formData.price.weekly)} ₽/нед.`;
            }
            if (formData.price?.monthly && formData.price.monthly !== '') {
                return `${formatPrice(formData.price.monthly)} ₽/мес.`;
            }
            return 'Цена не указана';
        };

        return {
            price: getPriceText(),
            type: getTypeLabel(formData.type || ''),
            location: formData.address,
            image: formData.photos?.[0] || undefined,
        };
    };

    const handleBack = () => {
        if (currentStep === 1) {
            navigation.goBack();
        } else if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as AdvertisementStep);
        }
    };

    const isNextDisabled = () => {
        if (isCreating) return true; // Блокируем кнопку во время загрузки

        switch (currentStep) {
            case 1:
                return !formData.type;
            case 2:
                return !formData.address || !formData.area;
            case 3:
                return !formData.description || formData.photos.length === 0;
            case 4:
                const hasValidPrice =
                    (formData.price.hourly && formData.price.hourly !== '') ||
                    (formData.price.daily && formData.price.daily !== '') ||
                    (formData.price.weekly && formData.price.weekly !== '') ||
                    (formData.price.monthly && formData.price.monthly !== '');
                return !hasValidPrice || !formData.availability;
            case 5:
                return false;
            default:
                return false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <TypeStep
                        selectedType={formData.type}
                        onTypeSelect={handleTypeSelect}
                    />
                );
            case 2:
                return (
                    <BasicInfoStep
                        address={formData.address}
                        area={formData.area}
                        features={formData.features}
                        location={formData.location}
                        formData={formData}
                        onAddressChange={(address) => setFormData(prev => ({ ...prev, address }))}
                        onAreaChange={(area) => setFormData(prev => ({ ...prev, area }))}
                        onFeaturesChange={(features) => setFormData(prev => ({ ...prev, features }))}
                        onLocationSelect={handleLocationSelect}
                        navigation={navigation}
                    />
                );
            case 3:
                return (
                    <PhotosStep
                        photos={formData.photos || []}
                        description={formData.description || ''}
                        onPhotosChange={handlePhotosChange}
                        onDescriptionChange={handleDescriptionChange}
                    />
                );
            case 4:
                return (
                    <PriceStep
                        price={formData.price || {}}
                        availability={formData.availability}
                        onPriceChange={handlePriceChange}
                        onAvailabilityChange={handleAvailabilityChange}
                    />
                );
            case 5:
                return (
                    <PublishStep formData={formData} />
                );
            default:
                return null;
        }
    };

    const getStepTitle = (step: number) => {
        const titles = {
            1: 'Тип объявления',
            2: 'Основная информация',
            3: 'Фотографии',
            4: 'Цена и доступность',
            5: 'Публикация'
        };
        return titles[step as keyof typeof titles];
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <BackButton onPress={handleBack} />
                    <Text style={styles.stepTitle}>{getStepTitle(currentStep)}</Text>
                    <View style={styles.placeholder} />
                </View>
                <Text style={styles.stepIndicator}>
                    Шаг {currentStep} из 5: {getStepTitle(currentStep)}
                </Text>
                <ProgressBar currentStep={currentStep} totalSteps={5} />
            </View>

            <View style={styles.content}>
                {renderStep()}
            </View>

            <View style={styles.footer}>

                {createError && (
                    <Text style={styles.errorText}>{createError}</Text>
                )}

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        isNextDisabled() && styles.nextButtonDisabled
                    ]}
                    onPress={currentStep === 5 ? publishAdvertisement : handleNext}
                    disabled={isNextDisabled()}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === 5 ? 'Опубликовать' : 'Далее'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        padding: 16,
        paddingTop: 8,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 10,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.text,
        marginTop: 8,
        marginBottom: 20,
    },
    placeholder: {
        width: 40,
    },
    stepIndicator: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 2,
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: 16,
        paddingBottom: 24,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
    },
    nextButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: COLORS.gray[300],
    },
    nextButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: COLORS.red[50],
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
});