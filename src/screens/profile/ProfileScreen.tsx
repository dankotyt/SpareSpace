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
        logout
    } = useProfile();

    const [publicProfile, setPublicProfile] = useState<FormattedUserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const { userId } = route.params || {};

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
    const canEditProfile = isOwner(currentUser?.id, targetUserId);

    // Форматируем публичный профиль для отображения
    const formatPublicProfile = (profile: UserProfile): FormattedUserProfile => {
        return {
            ...profile,
            fullName: `${profile.firstName} ${profile.lastName} ${profile.patronymic || ''}`.trim(),
            joinYear: new Date(profile.createdAt).getFullYear().toString(),
            balance: 0,
            reviews: [], // Публичный профиль не включает отзывы
            listings: [], // Публичный профиль не включает объявления
            bookings: [], // Публичный профиль не включает бронирования
            stats: {
                totalListings: 0,
                activeListings: 0,
                totalBookings: 0,
                pendingBookings: 0,
                totalReviews: 0,
                averageRating: profile.rating || 0
            }
        };
    };

    // Загружаем публичный профиль если смотрим чужой профиль
    useEffect(() => {
        if (userId && currentUser && userId !== currentUser.id) {
            loadPublicProfile(userId);
        } else if (userId && !currentUser) {
            // Если не авторизован, но смотрим чужой профиль
            loadPublicProfile(userId);
        }
    }, [userId, currentUser]);

    const loadPublicProfile = async (profileUserId: number) => {
        try {
            setIsLoadingProfile(true);
            setProfileError(null);

            // Загружаем публичный профиль
            const profileResponse = await profileApiService.getPublicUserProfile(profileUserId);

            if (!profileResponse.success || !profileResponse.data) {
                throw new Error(profileResponse.message || 'Не удалось загрузить профиль');
            }

            const formattedProfile = formatPublicProfile(profileResponse.data);
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

    // Для своего профиля загружаем дополнительные данные
    useEffect(() => {
        if (isViewingOwnProfile && ownProfile) {
            // Догружаем дополнительные данные для своего профиля
            loadOwnProfileAdditionalData();
        }
    }, [isViewingOwnProfile, ownProfile]);

    const loadOwnProfileAdditionalData = async () => {
        if (!ownProfile || !currentUser) return;

        try {
            // Загружаем отзывы, объявления и бронирования для своего профиля
            const fullData = await profileApiService.getFullUserData(currentUser.id, currentUser.id);

            const updatedProfile: FormattedUserProfile = {
                ...ownProfile,
                reviews: Array.isArray(fullData.reviews) ? fullData.reviews : [],
                listings: Array.isArray(fullData.listings) ? fullData.listings : [],
                bookings: Array.isArray(fullData.bookings) ? fullData.bookings : [],
                stats: fullData.stats || {
                    totalListings: 0,
                    activeListings: 0,
                    totalBookings: 0,
                    pendingBookings: 0,
                    totalReviews: 0,
                    averageRating: 0
                }
            };

            // Если это свой профиль, обновляем данные
            if (isViewingOwnProfile) {
                // Здесь нужно обновить ownProfile в useProfile hook
                // Или использовать локальное состояние
            }
        } catch (error) {
            console.error('Error loading additional profile data:', error);
        }
    };

    // Обработчики (остаются без изменений)
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
        Alert.alert('Мои бронирования', 'Открытие экрана со всеми бронированиями');
    }, []);

    const handleBookingPress = useCallback((booking: any) => {
        Alert.alert('Бронирование', `Открытие ${booking.title}`);
    }, []);

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

    const safeListings = Array.isArray(displayProfile?.listings) ? displayProfile.listings : [];
    const safeBookings = Array.isArray(displayProfile?.bookings) ? displayProfile.bookings : [];
    const safeBalance = displayProfile?.balance || 0;

    // Для публичного профиля показываем только активные объявления
    const getFilteredListings = () => {
        if (canViewPrivateInfo) {
            return safeListings; // Все объявления для владельца
        } else {
            return safeListings.filter(listing => listing.status === 'ACTIVE'); // Только активные для посетителей
        }
    };

    const filteredListings = getFilteredListings();

    const renderContent = () => {
        if (!isAuthenticated && !userId) {
            // Не авторизован и не смотрим чужой профиль
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
                    canEdit={canEditProfile}
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
                        {safeBookings.length > 0 && (
                            <BookingsSection
                                bookings={safeBookings}
                                stats={safeStats}
                                onAllBookingsPress={handleAllBookingsPress}
                                onBookingPress={handleBookingPress}
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {renderContent()}

            {isViewingOwnProfile && (
                <View style={styles.bottomToolbarWrapper}>
                    <BottomToolbar />
                </View>
            )}
        </View>
    );
};

// Стили остаются без изменений
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollView: {
        flex: 1,
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