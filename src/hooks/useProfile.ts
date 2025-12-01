import { useState, useCallback, useEffect } from 'react';
import { UserProfile, FormattedUserProfile, UserStats } from '@/types/profile';
import { profileApiService } from '@/services/api/profileApi';
import { useAuth } from '@hooks/auth/useAuth';
import { tokenService } from '@/services/tokenService';
import { authApiService } from "@services/api/authApi";

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
        fullName: `${profile.firstName} ${profile.lastName} ${profile.patronymic || ''}`.trim(),
        joinYear: new Date(profile.createdAt).getFullYear().toString(),
        balance: 0,
        reviews: safeReviews,
        listings: safeListings,
        bookings: safeBookings,
        stats: safeStats
    };
};

export const useProfile = () => {
    const { isAuthenticated, logout: authLogout, isCheckingAuth, user: currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState<FormattedUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        try {
            const token = await tokenService.getToken();
            if (!token || token.trim() === '') {
                return false;
            }

            const profileResponse = await authApiService.getProfile();
            return profileResponse.success && !!profileResponse.data;
        } catch (error) {
            console.log('Auth check failed:', error);
            return false;
        }
    }, []);

    const loadProfile = useCallback(async (forceLoad = false) => {
        if (!isAuthenticated && !forceLoad) {
            setUserProfile(null);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const profileResponse = await profileApiService.getProfile();

            if (!profileResponse.success || !profileResponse.data) {
                throw new Error(profileResponse.message || 'Не удалось загрузить профиль');
            }

            const basicProfile = profileResponse.data;
            const userId = basicProfile.id;

            const currentUserId = currentUser?.id;

            const fullData = await profileApiService.getFullUserData(userId, currentUserId);

            const formattedProfile = formatFullUserProfile(
                basicProfile,
                fullData.reviews,
                fullData.listings,
                fullData.bookings,
                fullData.stats
            );

            setUserProfile(formattedProfile);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
            console.error('❌ Profile loading error:', err);
            setError(errorMessage);
            setUserProfile(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated, currentUser]);
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
        authLogout();
    }, [authLogout]);

    useEffect(() => {
        const initialize = async () => {
            if (isAuthenticated) {
                await loadProfile(true);
            } else {
                setLoading(false);
            }
        };

        initialize();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setUserProfile(null);
            setError(null);
            setLoading(false);
        }
    }, [isAuthenticated]);

    return {
        isAuthenticated,
        userProfile,
        loading: loading || isCheckingAuth,
        refreshing,
        error,
        handleRefresh,
        logout,
        loadProfile: () => loadProfile(true),
    };
};