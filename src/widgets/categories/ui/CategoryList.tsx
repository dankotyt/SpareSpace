import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';

interface Category {
    id: string;
    title: string;
    type: string;
}

interface CategoryListProps {
    categories: Category[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
                                                              categories,
                                                              // selectedCategory,
                                                              onCategorySelect,
                                                          }) => {

    const getCategoryIcon = (type: string) => {
        switch (type) {
            case 'parking':
                return <MaterialIcons name="local-parking" size={24} color={COLORS.primary} />;
            case 'garage':
                return <MaterialIcons name="garage" size={24} color={COLORS.primary} />;
            case 'pantry':
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
        paddingHorizontal: 16,
        gap: 20,
        alignItems: 'center',
    },
    categoryItem: {
        width: 120,
        height: 80,
        backgroundColor: '#E9E5FF',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
    },
    categoryItemSelected: {
        backgroundColor: COLORS.primary,
    },
    categoryText: {
        color: '#202020',
        fontSize: 14,
        fontWeight: '500',
    },
    categoryIcon: {
        fontSize: 20,
        color: COLORS.primary,
        alignSelf: 'flex-end',
    },
});