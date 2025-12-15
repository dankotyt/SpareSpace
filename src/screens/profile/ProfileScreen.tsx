// screens/profile/ProfileScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    RefreshControl,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Text,
    TouchableOpacity,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { ProfileMenu } from '@components/profile/ProfileMenu';
import { ListingsSection } from '@components/profile/ListingsSection';
import { BalanceSection } from '@components/profile/BalanceSection';
import { BookingsSection } from '@components/profile/BookingsSection';
import { StatsSection } from '@components/profile/StatsSection';
import { BottomToolbar } from '@components/ui/BottomToolbar';
import { UnauthorizedProfile } from '@components/profile/UnauthorizedProfile';
import { COLORS } from '@shared/constants/colors';
import { RootStackParamList } from '@navigation/types';
import { useAuth } from '@hooks/auth/useAuth';
import { useProfile } from '@hooks/useProfile';
import { profileApiService } from '@/services/api/profileApi';
import { FormattedUserProfile, UserProfile } from '@/types/profile';
import {LandlordBookingsSection} from "@components/profile/LandlordBookingsSection";

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
    const route = useRoute<ProfileScreenRouteProp>();
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const { user: currentUser, isAuthenticated } = useAuth();
    const {
        userProfile: ownProfile,
        loading,
        refreshing,
        error,
        handleRefresh,
        logout,
        loadProfile,
        setUserProfile,
    } = useProfile();

    const [publicProfile, setPublicProfile] = useState<FormattedUserProfile | null>(null);
    const [publicListings, setPublicListings] = useState<any[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const { userId } = route.params || {};
    const [isLandlord, setIsLandlord] = useState(false);
    // Определяем, чей профиль мы смотрим
    const isViewingOwnProfile = !userId || (currentUser && userId === currentUser.id);
    const targetUserId = userId || currentUser?.id;

    const isOwner = (currentUserId: number | undefined, profileUserId: number): boolean => {
        return currentUserId === profileUserId;
    };

    // Профиль для отображения
    const displayProfile = isViewingOwnProfile ? ownProfile : publicProfile;

    // Проверяем права доступа - только по ID
    const canViewPrivateInfo = isOwner(currentUser?.id, targetUserId);

    const safeListings = Array.isArray(displayProfile?.listings) ? displayProfile.listings : [];
    const safeBookings = Array.isArray(displayProfile?.bookings) ? displayProfile.bookings : [];
    const safeBalance = displayProfile?.balance || 0;

    const filteredListings = safeListings.filter(listing =>
        isViewingOwnProfile || listing.status === 'ACTIVE'
    );

    useEffect(() => {
        if (isViewingOwnProfile && ownProfile) {
            loadOwnProfileAdditionalData();
            checkIfUserIsLandlord();
        }
    }, [isViewingOwnProfile, ownProfile, filteredListings]);

    const checkIfUserIsLandlord = () => {
        // Просто проверяем, есть ли активные объявления
        const hasActiveListings = filteredListings.length > 0;
        setIsLandlord(hasActiveListings);
    };

    const loadUserReviews = async (userId: number) => {
        try {
            const reviewsResponse = await profileApiService.getUserReviews(userId);
            return Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];
        } catch (error) {
            console.error('Error loading user reviews:', error);
            return [];
        }
    };

    const formatPublicProfile = async (profile: UserProfile, listings: any[] = []): Promise<FormattedUserProfile> => {
        const safeListings = Array.isArray(listings) ? listings : [];
        const activeListings = safeListings.filter(listing => listing.status === 'ACTIVE');

        const reviews = await loadUserReviews(profile.id);

        return {
            ...profile,
            fullName: `${profile.firstName} ${profile.lastName} ${profile.patronymic || ''}`.trim(),
            joinYear: new Date(profile.createdAt).getFullYear().toString(),
            balance: 0,
            reviews: reviews,
            listings: activeListings,
            bookings: [],
            stats: {
                totalListings: safeListings.length,
                activeListings: activeListings.length,
                totalBookings: 0,
                pendingBookings: 0,
                totalReviews: reviews.length,
                averageRating: reviews.length > 0
                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                    : profile.rating || 0
            }
        };
    };

    useEffect(() => {
        if (userId && (currentUser?.id !== userId || !currentUser)) {
            loadPublicProfile(userId);
        }
    }, [userId, currentUser]);

    const loadPublicProfile = async (profileUserId: number) => {
        try {
            setIsLoadingProfile(true);
            setProfileError(null);

            const profileResponse = await profileApiService.getPublicUserProfile(profileUserId);

            if (!profileResponse.success || !profileResponse.data) {
                throw new Error(profileResponse.message || 'Не удалось загрузить профиль');
            }

            const listingsResponse = await profileApiService.getUserListings(profileUserId);
            const userListings = Array.isArray(listingsResponse.data) ? listingsResponse.data : [];

            const formattedProfile = await formatPublicProfile(profileResponse.data, userListings);
            setPublicProfile(formattedProfile);

        } catch (error) {
            console.error('Error loading public profile:', error);
            const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить профиль пользователя';
            setProfileError(errorMessage);
            Alert.alert('Ошибка', errorMessage);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        if (isViewingOwnProfile && ownProfile) {
            loadOwnProfileAdditionalData();
        }
    }, [isViewingOwnProfile, ownProfile]);

    const loadOwnProfileAdditionalData = async () => {
        if (!ownProfile || !currentUser) return;

        try {
            const fullData = await profileApiService.getFullUserData(currentUser.id, currentUser.id);

            if (fullData.profile && fullData.stats) {
                const updatedProfile: FormattedUserProfile = {
                    ...ownProfile,
                    reviews: Array.isArray(fullData.reviews) ? fullData.reviews : [],
                    listings: Array.isArray(fullData.listings) ? fullData.listings : [],
                    bookings: Array.isArray(fullData.bookings) ? fullData.bookings : [],
                    stats: fullData.stats
                };

               setUserProfile(updatedProfile);
            }
        } catch (error) {
            console.error('Error loading additional profile data:', error);
        }
    };

    const handleMenuItemPress = useCallback((itemId: string) => {
        Alert.alert('Menu Item Pressed', `You pressed: ${itemId}`);
    }, []);

    const handleTopUp = useCallback(() => {
        Alert.alert('Пополнение', 'Пополнение баланса');
    }, []);

    const handleWithdraw = useCallback(() => {
        Alert.alert('Вывод', 'Вывод средств');
    }, []);

    const handlePromoCode = useCallback(() => {
        Alert.alert('Промокод', 'Ввод промокода');
    }, []);

    const handleOperations = useCallback(() => {
        Alert.alert('Операции', 'Просмотр операций');
    }, []);

    const handleReviewsPress = useCallback(() => {
        Alert.alert('Отзывы', 'Открытие экрана со всеми отзывами');
    }, []);

    const handleAllAdsPress = useCallback(() => {
        Alert.alert('Мои объявления', 'Открытие экрана со всеми объявлениями');
    }, []);

    const handleAssetPress = useCallback((asset: any) => {
        Alert.alert('Объявление', `Открытие: ${asset.title}`);
    }, []);

    const handleAllBookingsPress = useCallback(() => {
        navigation.navigate('Bookings');
    }, [navigation]);

    const handleBookingPress = useCallback((booking: any) => {
        navigation.navigate('BookingDetails', { bookingId: booking.id });
    }, [navigation]);

    const handlePendingBookingsPress = useCallback(() => {
        navigation.navigate('LandlordBookings');
    }, [navigation]);

    const handleAllLandlordBookingsPress = useCallback(() => {
        navigation.navigate('LandlordBookings');
    }, [navigation]);

    const handleLoginPress = useCallback(() => {
        navigation.navigate('PhoneAuth');
    }, [navigation]);

    const handleStatsPress = useCallback(() => {
        if (!displayProfile?.stats) return;

        Alert.alert('Статистика',
            `Всего объявлений: ${displayProfile.stats.totalListings || 0}\n` +
            `Активных: ${displayProfile.stats.activeListings || 0}\n` +
            `Бронирований: ${displayProfile.stats.totalBookings || 0}\n` +
            `Отзывов: ${displayProfile.stats.totalReviews || 0}`
        );
    }, [displayProfile]);

    const handleRefreshProfile = useCallback(() => {
        if (isViewingOwnProfile) {
            handleRefresh();
        } else if (userId) {
            loadPublicProfile(userId);
        }
    }, [isViewingOwnProfile, userId, handleRefresh]);

    // Безопасные данные
    const safeStats = displayProfile?.stats || {
        totalListings: 0,
        activeListings: 0,
        totalBookings: 0,
        pendingBookings: 0,
        totalReviews: 0,
        averageRating: 0
    };

    const handleBackPress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const renderContent = () => {
        if (!isAuthenticated && !userId) {
            return (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <UnauthorizedProfile onLoginPress={handleLoginPress} />
                </ScrollView>
            );
        }

        const isLoading = (isViewingOwnProfile ? loading : isLoadingProfile);
        const hasError = (isViewingOwnProfile ? error : profileError);
        const hasProfile = !!displayProfile;

        if (isLoading && !hasProfile) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>
                        {isViewingOwnProfile ? 'Загрузка профиля...' : 'Загрузка публичного профиля...'}
                    </Text>
                </View>
            );
        }

        if (hasError && !hasProfile) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Ошибка загрузки</Text>
                    <Text style={styles.errorText}>{hasError}</Text>
                    <Text style={styles.retryText} onPress={handleRefreshProfile}>
                        Попробовать снова
                    </Text>
                    {isViewingOwnProfile && (
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <Text style={styles.logoutButtonText}>Выйти из профиля</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        if (!hasProfile) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Профиль не найден</Text>
                    <Text style={styles.errorText}>Не удалось загрузить данные профиля</Text>
                    <Text style={styles.retryText} onPress={handleRefreshProfile}>
                        Попробовать снова
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={isViewingOwnProfile ? refreshing : isLoadingProfile}
                        onRefresh={handleRefreshProfile}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <ProfileHeader
                    profile={displayProfile}
                    onReviewsPress={handleReviewsPress}
                    canEdit={isViewingOwnProfile}
                    isPublicProfile={!isViewingOwnProfile}
                    onBackPress={!isViewingOwnProfile ? handleBackPress : undefined}
                />

                <StatsSection
                    stats={safeStats}
                    onPress={handleStatsPress}
                />

                {/* Объявления показываем только если они есть */}
                {filteredListings.length > 0 && (
                    <ListingsSection
                        listings={filteredListings}
                        onAllAdsPress={handleAllAdsPress}
                        onAssetPress={handleAssetPress}
                        showAllListings={canViewPrivateInfo}
                    />
                )}

                {/* Показываем приватные секции только владельцу */}
                {canViewPrivateInfo && (
                    <>
                        <BookingsSection
                            userId={targetUserId!}
                            stats={safeStats}
                            onAllBookingsPress={handleAllBookingsPress}
                            onBookingPress={handleBookingPress}
                        />

                        {/* Бронирования объектов (где пользователь - арендодатель) */}
                        {isLandlord && (
                            <LandlordBookingsSection
                                userId={targetUserId!}
                                stats={safeStats}
                                onAllBookingsPress={handleAllLandlordBookingsPress}
                                onBookingPress={handleBookingPress}
                                onPendingBookingsPress={handlePendingBookingsPress}
                            />
                        )}

                        <BalanceSection
                            balance={safeBalance}
                            onTopUp={handleTopUp}
                            onWithdraw={handleWithdraw}
                            onPromoCode={handlePromoCode}
                            operations={handleOperations}
                        />

                        <ProfileMenu
                            onMenuItemPress={handleMenuItemPress}
                            onLogout={logout}
                        />
                    </>
                )}
            </ScrollView>
        );
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]} >
            {renderContent()}

            {isViewingOwnProfile && (
                <View style={styles.bottomToolbarWrapper}>
                    <BottomToolbar />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.gray[500],
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.red[500],
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: COLORS.gray[600],
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    retryText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    bottomToolbarWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
    },
    logoutButton: {
        backgroundColor: COLORS.red[500],
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    logoutButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});