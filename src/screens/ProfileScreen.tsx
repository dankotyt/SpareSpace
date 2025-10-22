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
import { AssetsSection } from '@/components/profile/AssetsSection';
import { BalanceSection } from '@/components/profile/BalanceSection';
import { BottomToolbar } from '@/components/ui/BottomToolbar';
import { UnauthorizedProfile } from '@/components/profile/UnauthorizedProfile';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '@/shared/constants/colors';
import {ProfileStackParamList} from "@/navigation/types";

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export const ProfileScreen: React.FC = () => {
    const { isAuthenticated, userProfile, userAssets, refreshing, loading, handleRefresh, logout, login } = useProfile();
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

    const handleLoginPress = useCallback(() => {
        navigation.navigate('PhoneAuth');
    }, [navigation]);

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

    // Загрузка
    if (loading && !userProfile) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка профиля...</Text>
            </View>
        );
    }

    // Ошибка загрузки
    if (!userProfile) {
        return (
            <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>Не удалось загрузить профиль</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
                <ProfileHeader
                    profile={userProfile}
                    onReviewsPress={handleReviewsPress}
                />

                <AssetsSection
                    assets={userAssets}
                    onAllAdsPress={handleAllAdsPress}
                    onAssetPress={handleAssetPress}
                />

                <BalanceSection
                    balance={userProfile.balance}
                    onTopUp={handleTopUp}
                    onWithdraw={handleWithdraw}
                    onPromoCode={handlePromoCode}
                    operations={handleOperations}
                />

                <ProfileMenu onMenuItemPress={handleMenuItemPress}  onLogout={logout} />
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
    },
    errorText: {
        fontSize: 16,
        color: COLORS.red[500],
    },
    bottomToolbarWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
    },
});