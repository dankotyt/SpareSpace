import { useState, useCallback, useEffect } from 'react';
import { UserProfile, UserAsset } from '@/entities/user/model/types';
import { profileApi } from './profileApi';

export const useProfile = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(true); // Начинаем с авторизованного состояния
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadProfileData = useCallback(async () => {
        if (!isAuthenticated) {
            setUserProfile(null);
            setUserAssets([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [profile, assets] = await Promise.all([
                profileApi.getUserProfile(),
                profileApi.getUserAssets()
            ]);
            setUserProfile(profile);
            setUserAssets(assets);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const handleRefresh = useCallback(async () => {
        if (!isAuthenticated) return;

        setRefreshing(true);
        await loadProfileData();
        setRefreshing(false);
    }, [loadProfileData, isAuthenticated]);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
        setUserProfile(null);
        setUserAssets([]);
    }, []);

    const login = useCallback(() => {
        setIsAuthenticated(true);
        loadProfileData();
    }, [loadProfileData]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    return {
        isAuthenticated,
        userProfile,
        userAssets,
        refreshing,
        loading,
        handleRefresh,
        logout,
        login,
        loadProfileData,
    };
};