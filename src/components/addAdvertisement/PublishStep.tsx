import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface PublishStepProps {
    formData: any;
}

export const PublishStep: React.FC<PublishStepProps> = ({ formData }) => {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'parking': return 'Парковочное место';
            case 'pantry': return 'Кладовка';
            case 'garage': return 'Гараж';
            default: return '';
        }
    };

    const getPriceText = () => {
        if (formData.price?.daily && formData.price.daily !== '') {
            return `${formData.price.daily} руб./день`;
        }
        if (formData.price?.weekly && formData.price.weekly !== '') {
            return `${formData.price.weekly} руб./неделя`;
        }
        if (formData.price?.monthly && formData.price.monthly !== '') {
            return `${formData.price.monthly} руб./месяц`;
        }
        return 'Не указана';
    };

    const getAvailabilityText = () => {
        if (formData.availability) {
            const start = new Date(formData.availability.startDate);
            const end = new Date(formData.availability.endDate);
            return `Доступно с ${start.toLocaleDateString('ru')} по ${end.toLocaleDateString('ru')}`;
        }
        return 'Не указан';
    };

    const checklistItems = [
        {
            label: 'Тип помещения',
            value: getTypeLabel(formData.type),
            checked: !!formData.type,
        },
        {
            label: 'Адрес',
            value: formData.address,
            checked: !!formData.address,
        },
        {
            label: 'Площадь',
            value: formData.area ? `${formData.area} м²` : 'Не указана',
            checked: !!formData.area,
        },
        {
            label: 'Цена',
            value: getPriceText(),
            checked: !!getPriceText() && getPriceText() !== 'Не указана',
        },
        {
            label: 'Период аренды',
            value: getAvailabilityText(),
            checked: !!formData.availability,
        },
        {
            label: 'Описание',
            value: formData.description || 'Не указано',
            checked: !!formData.description,
        },
        {
            label: 'Фотографии',
            value: formData.photos?.length ? `Загружено ${formData.photos.length} фото` : 'Не загружены',
            checked: !!formData.photos?.length,
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Проверка и публикация</Text>
                <Text style={styles.sectionText}>Проверьте все свои данные перед публикацией</Text>

                <View style={styles.checklist}>
                    {checklistItems.map((item, index) => (
                        <View key={index} style={styles.checklistItem}>
                            <View style={styles.checklistLeft}>
                                <View style={styles.checkbox}>
                                    {item.checked && <View style={styles.checkboxSelected} />}
                                </View>
                                <Text style={styles.checklistLabel}>{item.label}</Text>
                            </View>
                            <Text style={styles.checklistValue}>{item.value}</Text>
                        </View>
                    ))}
                </View>
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginBottom: 20,
    },
    checklist: {
        gap: 16,
    },
    checklistItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    checklistLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: COLORS.gray[400],
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        width: 12,
        height: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    checklistLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    checklistValue: {
        fontSize: 14,
        color: COLORS.gray[600],
        textAlign: 'right',
        flex: 1,
        marginLeft: 8,
    },
});