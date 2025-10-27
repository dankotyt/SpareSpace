import { useState, useCallback, useEffect } from 'react';
import { UserProfile, FormattedUserProfile, Review, Listing, Booking, UserStats } from '@/types/profile';
import { profileApiService } from '@/services/api/profileApi';
import { useAuth } from '@/hooks/useAuth';
import { tokenService } from '@/services/tokenService';

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
    const { isAuthenticated, logout: authLogout } = useAuth();
    const [userProfile, setUserProfile] = useState<FormattedUserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        if (!isAuthenticated) {
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

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
            setError(errorMessage);
            setUserProfile(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadProfile();
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
        loadProfile();
    }, [loadProfile]);

    return {
        isAuthenticated,
        userProfile,
        loading,
        refreshing,
        error,
        handleRefresh,
        logout,
        loadProfile,
    };
};