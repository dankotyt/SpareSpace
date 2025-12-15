import React, { useState } from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity} from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { formatPrice } from '@shared/utils/listingFormatter';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

interface PriceStepProps {
    price: {
        hourly?: string;
        daily?: string;
        weekly?: string;
        monthly?: string;
    };
    availability?: {
        start: string;
        end: string;
    }[];
    onPriceChange: (price: any) => void;
    onAvailabilityChange: (availability: { start: string; end: string }[] | undefined) => void;
}

export const PriceStep: React.FC<PriceStepProps> = ({
                                                        price,
                                                        availability,
                                                        onPriceChange,
                                                        onAvailabilityChange,
                                                    }) => {
    const [selectedPriceType, setSelectedPriceType] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | null>(null);
    const [formattedPrice, setFormattedPrice] = useState('');

    const handleDateRangeSelected = (start: Date, end: Date) => {
        const availabilityData = [{
            start: start.toISOString(),
            end: end.toISOString()
        }];

        console.log('✅ Saving availability:', availabilityData);
        onAvailabilityChange(availabilityData);
    };

    const priceTypes = [
        { key: 'hourly', label: 'Цена в час', placeholder: 'руб./час' },
        { key: 'daily', label: 'Цена за день', placeholder: 'руб./день' },
        { key: 'weekly', label: 'Цена за неделю', placeholder: 'руб./неделя' },
        { key: 'monthly', label: 'Цена за месяц', placeholder: 'руб./месяц' },
    ];

    const handlePriceTypeSelect = (priceType: 'hourly' | 'daily' | 'weekly' | 'monthly') => {
        const newPrice = {
            hourly: '',
            daily: '',
            weekly: '',
            monthly: '',
            [priceType]: price[priceType] || ''
        };

        onPriceChange(newPrice);
        setSelectedPriceType(priceType);

        if (newPrice[priceType]) {
            setFormattedPrice(formatPrice(newPrice[priceType]));
        } else {
            setFormattedPrice('');
        }
    };

    const handlePriceInputChange = (value: string) => {
        const cleanedValue = value.replace(/[^\d.]/g, '');

        if (selectedPriceType) {
            const newPrice = {
                hourly: '',
                daily: '',
                weekly: '',
                monthly: '',
                [selectedPriceType]: cleanedValue
            };

            onPriceChange(newPrice);
            setFormattedPrice(formatPrice(cleanedValue));
        }
    };

    const getFormattedPrice = (priceType: string): string => {
        const priceValue = price[priceType as keyof typeof price];
        if (!priceValue) return '';
        return formatPrice(priceValue);
    };

    const getCurrentPriceValue = () => {
        return selectedPriceType ? price[selectedPriceType] || '' : '';
    };

    const getSelectedPriceType = () => {
        const filledTypes = Object.entries(price).filter(([_, value]) => value && value !== '');
        if (filledTypes.length > 0) {
            return filledTypes[0][0] as 'hourly' | 'daily' | 'weekly' | 'monthly';
        }
        return selectedPriceType;
    };

    const isPriceSelected = (priceType: string) => {
        const currentSelectedType = getSelectedPriceType();
        return currentSelectedType === priceType;
    };

    const getCurrentPriceDisplay = () => {
        const currentSelectedType = getSelectedPriceType();
        if (currentSelectedType && price[currentSelectedType]) {
            const priceLabel = priceTypes.find(type => type.key === currentSelectedType)?.label || currentSelectedType;
            return {
                type: priceLabel,
                value: formatPrice(price[currentSelectedType])
            };
        }
        return null;
    };

    const renderCurrentPrices = () => {
        const filledPrices = Object.entries(price).filter(([_, value]) => value && value !== '');

        if (filledPrices.length === 0) return null;

        return (
            <View style={styles.currentPrices}>
                <Text style={styles.currentPricesTitle}>Установленные цены:</Text>
                {filledPrices.map(([key, value]) => {
                    const priceLabel = priceTypes.find(type => type.key === key)?.label || key;
                    return (
                        <View key={key} style={styles.priceItem}>
                            <Text style={styles.priceItemLabel}>{priceLabel}:</Text>
                            <Text style={styles.priceItemValue}>{formatPrice(value)} руб.</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Выберите тип цены</Text>
                <Text style={styles.sectionSubtext}>
                    Можно выбрать только один вариант
                </Text>

                {/* Отображение текущей выбранной цены */}
                {getCurrentPriceDisplay() && (
                    <View style={styles.selectedPriceInfo}>
                        <Text style={styles.selectedPriceTitle}>Выбрано:</Text>
                        <View style={styles.selectedPriceDetails}>
                            <Text style={styles.selectedPriceType}>{getCurrentPriceDisplay()!.type}:</Text>
                            <Text style={styles.selectedPriceValue}>{getCurrentPriceDisplay()!.value} руб.</Text>
                        </View>
                    </View>
                )}

                <View style={styles.priceOptions}>
                    {priceTypes.map((priceType) => (
                        <View key={priceType.key} style={styles.priceOption}>
                            <TouchableOpacity
                                style={styles.radioContainer}
                                onPress={() => handlePriceTypeSelect(priceType.key as any)}
                            >
                                <View style={styles.radio}>
                                    {isPriceSelected(priceType.key) && <View style={styles.radioSelected} />}
                                </View>
                                <Text style={styles.radioLabel}>{priceType.label}</Text>
                            </TouchableOpacity>

                            {isPriceSelected(priceType.key) && (
                                <View style={styles.priceInputContainer}>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={getCurrentPriceValue()}
                                        onChangeText={handlePriceInputChange}
                                        placeholder={priceType.placeholder}
                                        placeholderTextColor={COLORS.gray[400]}
                                        keyboardType="decimal-pad"
                                        autoFocus
                                    />
                                    {formattedPrice ? (
                                        <Text style={styles.formattedPrice}>{formattedPrice} руб.</Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Доступность</Text>
                <Text style={styles.sectionSubtext}>
                    Выберите период, когда объект будет доступен для бронирования
                </Text>

                <DateRangePicker
                    onDateRangeSelected={handleDateRangeSelected}
                    initialStartDate={availability && availability[0]?.start ? new Date(availability[0].start) : undefined}
                    initialEndDate={availability && availability[0]?.end ? new Date(availability[0].end) : undefined}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    sectionSubtext: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginBottom: 16,
    },
    priceOptions: {
        gap: 20,
    },
    priceOption: {
        gap: 8,
    },
    priceLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    priceInputContainer: {
        gap: 8,
    },
    priceInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray[300],
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        width: '100%',
    },
    formattedPrice: {
        fontSize: 14,
        color: COLORS.gray[600],
        fontStyle: 'italic',
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    radioLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    currentPrices: {
        backgroundColor: COLORS.gray[100],
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
    },
    currentPricesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    priceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priceItemLabel: {
        fontSize: 12,
        color: COLORS.gray[600],
    },
    priceItemValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    selectedPriceInfo: {
        backgroundColor: COLORS.primaryLight,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    selectedPriceTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
    },
    selectedPriceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedPriceType: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    selectedPriceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
});