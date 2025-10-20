import React from 'react';
import { useMain } from '../../model/useMain';
import { MainLayout } from '@/widgets/main';

export const Main: React.FC = () => {
    const { categories, ads, selectedCategory, handleCategorySelect, handleRefresh, isRefreshing } = useMain();

    return (
        <MainLayout
            categories={categories}
            ads={ads}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
        />
    );
};