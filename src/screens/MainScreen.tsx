import React from 'react';
import { useMain } from '@/hooks/useMain';
import { MainLayout } from '@/components/main/MainLayout';

export const MainScreen: React.FC = () => {
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