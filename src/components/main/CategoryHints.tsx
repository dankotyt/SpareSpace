import React from 'react';
import { CategoryList } from '@/components/main/CategoryList';
import { CategoryItem } from '@/types/main';

interface CategoryHintsProps {
    categories: CategoryItem[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
}

export const CategoryHints: React.FC<CategoryHintsProps> = (props) => {
    return <CategoryList {...props} />;
};