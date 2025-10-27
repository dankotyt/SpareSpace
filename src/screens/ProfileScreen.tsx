import React, { useCallback } from 'react';
import {
    View,
    ScrollView,
    RefreshControl,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '@/hooks/useProfile';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import { ListingsSection } from '@components/profile/ListingsSection';
import { BalanceSection } from '@/components/profile/BalanceSection';
import { BookingsSection } from '@/components/profile/BookingsSection';
import { StatsSection } from '@/components/profile/StatsSection';
import { BottomToolbar } from '@/components/ui/BottomToolbar';
import { UnauthorizedProfile } from '@/components/profile/UnauthorizedProfile';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '@/shared/constants/colors';
import { ProfileStackParamList } from '@/navigation/types';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export const ProfileScreen: React.FC = () => {
    const { isAuthenticated, userProfile, loading, refreshing, error, handleRefresh, logout } = useProfile();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfileScreenNavigationProp>();

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
        Alert.alert('Статистика', `Всего объявлений: ${userProfile?.stats?.totalListings || 0}\nАктивных: ${userProfile?.stats?.activeListings || 0}\nБронирований: ${userProfile?.stats?.totalBookings || 0}\nОтзывов: ${userProfile?.stats?.totalReviews || 0}`);
    }, [userProfile]);

    const safeStats = userProfile?.stats || {
        totalListings: 0,
        activeListings: 0,
        totalBookings: 0,
        pendingBookings: 0,
        totalReviews: 0,
        averageRating: 0
    };

    const safeListings = Array.isArray(userProfile?.listings) ? userProfile.listings : [];
    const safeBookings = Array.isArray(userProfile?.bookings) ? userProfile.bookings : [];
    const safeBalance = userProfile?.balance || 0;

    const safeProfile = userProfile ? { ...userProfile } : null;

    const renderContent = () => {
        if (!safeProfile) {
            return null;
        }

        return (
            <>
                <ProfileHeader
                    profile={safeProfile}
                    onReviewsPress={handleReviewsPress}
                />

                <StatsSection
                    stats={safeStats}
                    onPress={handleStatsPress}
                />

                <ListingsSection
                    listings={safeListings}
                    onAllAdsPress={handleAllAdsPress}
                    onAssetPress={handleAssetPress}
                />

                <BookingsSection
                    bookings={safeBookings}
                    stats={safeStats}
                    onAllBookingsPress={handleAllBookingsPress}
                    onBookingPress={handleBookingPress}
                />

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
        );
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
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

                <View style={styles.bottomToolbarWrapper}>
                    <BottomToolbar />
                </View>
            </View>
        );
    }

    if (loading && !userProfile) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка профиля...</Text>
            </View>
        );
    }

    if (error && !userProfile) {
        return (
            <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
                <Text style={styles.errorTitle}>Ошибка загрузки</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryText} onPress={handleRefresh}>
                    Попробовать снова
                </Text>
            </View>
        );
    }

    if (!userProfile) {
        return (
            <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
                <Text style={styles.errorTitle}>Профиль не найден</Text>
                <Text style={styles.errorText}>Не удалось загрузить данные профиля</Text>
                <Text style={styles.retryText} onPress={handleRefresh}>
                    Попробовать снова
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
                {renderContent()}
            </ScrollView>

            <View style={styles.bottomToolbarWrapper}>
                <BottomToolbar />
            </View>
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
        backgroundColor: COLORS.background,
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
});