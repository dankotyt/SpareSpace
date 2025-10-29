import { useState, useCallback, useEffect } from 'react';
import { UserProfile, FormattedUserProfile, Review, Listing, Booking, UserStats } from '@/types/profile';
import { profileApiService } from '@/services/api/profileApi';
import { useAuth } from '@/hooks/useAuth';
import { tokenService } from '@/services/tokenService';
import {authApiService} from "@services/api/authApi";

const formatFullUserProfile = (
    profile: UserProfile,
    reviews: any,
    listings: any,
    bookings: any,
    stats: UserStats
): FormattedUserProfile => {

    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const safeListings = Array.isArray(listings) ? listings : [];
    const safeBookings = Array.isArray(bookings) ? bookings : [];

    const safeStats = stats || {
        totalListings: 0,
        activeListings: 0,
        totalBookings: 0,
        pendingBookings: 0,
        totalReviews: 0,
        averageRating: 0
    };

    return {
        ...profile,
        fullName: `${profile.first_name} ${profile.last_name} ${profile.patronymic || ''}`.trim(),
        joinYear: new Date(profile.created_at).getFullYear().toString(),
        reviewsCount: safeReviews.length,
        balance: 0,
        reviews: safeReviews,
        listings: safeListings,
        bookings: safeBookings,
        stats: safeStats
    };
};

export const useProfile = () => {
    const { isAuthenticated, logout: authLogout, isCheckingAuth } = useAuth();
    const [userProfile, setUserProfile] = useState<FormattedUserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localIsAuthenticated, setLocalIsAuthenticated] = useState(false);

    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        try {
            const token = await tokenService.getToken();
            if (!token || token.trim() === '') {
                return false;
            }

            const profileResponse = await authApiService.getProfile();
            return profileResponse.success && !!profileResponse.data;
        } catch (error) {
            return false;
        }
    }, []);

    const loadProfile = useCallback(async (forceLoad = false) => {
        if (!isAuthenticated && !forceLoad) {
            setUserProfile(null);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await tokenService.getToken();
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            const profileResponse = await profileApiService.getProfile();

            if (!profileResponse.success || !profileResponse.data) {
                throw new Error(profileResponse.message || 'Не удалось загрузить профиль');
            }

            const basicProfile = profileResponse.data;
            const userId = basicProfile.id;

            const fullData = await profileApiService.getFullUserData(userId);

            const formattedProfile = formatFullUserProfile(
                basicProfile,
                fullData.reviews,
                fullData.listings,
                fullData.bookings,
                fullData.stats
            );

            setUserProfile(formattedProfile);
            setLocalIsAuthenticated(true);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
            setError(errorMessage);
            setUserProfile(null);
            setLocalIsAuthenticated(false);

            if (err instanceof Error && (
                err.message.includes('токен') ||
                err.message.includes('authorization') ||
                err.message.includes('401')
            )) {
                await tokenService.removeToken();
                authLogout();
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated, authLogout]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadProfile(true);
    }, [loadProfile]);

    const logout = useCallback(async () => {
        try {
            await tokenService.removeToken();
        } catch (error) {
            console.error('Error removing token:', error);
        }

        setUserProfile(null);
        setError(null);
        setLocalIsAuthenticated(false);
        authLogout();
    }, [authLogout]);

    useEffect(() => {
        const initializeProfile = async () => {
            const authStatus = await checkAuthStatus();
            setLocalIsAuthenticated(authStatus);

            if (authStatus) {
                await loadProfile(true);
            }
        };

        initializeProfile();
    }, [checkAuthStatus, loadProfile]);

    useEffect(() => {
        if (isAuthenticated && !loading) {
            loadProfile(true);
        } else if (!isAuthenticated) {
            setUserProfile(null);
            setLocalIsAuthenticated(false);
        }
    }, [isAuthenticated, loadProfile, loading]);

    return {
        isAuthenticated: localIsAuthenticated || isAuthenticated,
        userProfile,
        loading: loading || isCheckingAuth,
        refreshing,
        error,
        handleRefresh,
        logout,
        loadProfile: () => loadProfile(true),
    };
};