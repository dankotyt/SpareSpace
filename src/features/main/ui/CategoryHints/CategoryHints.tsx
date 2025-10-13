import React from 'react';
import { CategoryList } from '@/widgets/categories';
import { CategoryItem } from '../../model/types';

interface CategoryHintsProps {
    categories: CategoryItem[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
}

export const CategoryHints: React.FC<CategoryHintsProps> = (props) => {
    return <CategoryList {...props} />;
};