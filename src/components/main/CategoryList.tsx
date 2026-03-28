import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';
import { normalize, wp } from '@/shared/utils/scaling';

/**
 * React-компонент для отображения счетчика уведомлений в виде пузыря
 * Используется для непрочитанных сообщений и других уведомлений
 */
interface Category {
    id: string;
    title: string;
    type: string;
}

/**
 * Интерфейс пропсов компонента списка категорий
 */
interface CategoryListProps {
    categories: Category[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
}

/**
 * React-компонент горизонтального списка категорий для фильтрации объявлений
 * Отображает иконки и названия типов парковочных мест
 */
export const CategoryList: React.FC<CategoryListProps> = ({
                                                              categories,
                                                              // selectedCategory,
                                                              onCategorySelect,
                                                          }) => {

    /**
     * Определяет иконку для типа категории
     * @param type - строковый идентификатор типа категории
     * @returns React-элемент иконки MaterialIcons
     */
    const getCategoryIcon = (type: string) => {
        switch (type) {
            case 'PARKING':
                return <MaterialIcons name="local-parking" size={24} color={COLORS.primary} />;
            case 'GARAGE':
                return <MaterialIcons name="garage" size={24} color={COLORS.primary} />;
            case 'STORAGE':
                return <MaterialIcons name="inventory-2" size={24} color={COLORS.primary} />;
            default:
                return <MaterialIcons name="search" size={24} color={COLORS.primary} />;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryItem,
                            // selectedCategory === category.id && styles.categoryItemSelected
                        ]}
                        onPress={() => onCategorySelect(category.id)}
                    >
                        <Text style={styles.categoryText}>{category.title}</Text>
                        <Text style={styles.categoryIcon}>{getCategoryIcon(category.type)}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 1,
        marginTop: 20,
    },
    scrollContent: {
        paddingHorizontal: wp(4),
        gap: wp(5),
        alignItems: 'center',
    },
    categoryItem: {
        width: wp(32),               // 28% ширины (было 120px -> ~28% при базовой 430)
        height: wp(24),               // 18% ширины (соотношение сторон)
        backgroundColor: '#E9E5FF',
        borderRadius: normalize(16),
        padding: normalize(12),
        justifyContent: 'space-between',
    },
    categoryText: {
        color: '#202020',
        fontSize: normalize(14),
        fontWeight: '500',
    },
    categoryIcon: {
        fontSize: normalize(20),
        color: COLORS.primary,
        alignSelf: 'flex-end',
    },
});