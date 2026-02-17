import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@hooks/auth/useAuth";
import { useFocusEffect } from "@react-navigation/core";
import { listingApiService, ListingResponse } from "@services/api/listingApi";
import { formatPriceWithCurrency } from "@shared/utils/listingFormatter";

/**
 * Тип для статусов объявлений
 */
type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PENDING' | 'REJECTED';

/**
 * Тип для вкладок
 */
type TabType = 'all' | 'active' | 'inactive' | 'pending';

/**
 * Интерфейс для группировки статусов по вкладкам
 */
interface StatusGroup {
    all: ListingStatus[];
    active: ListingStatus[];
    inactive: ListingStatus[];
    pending: ListingStatus[];
}

/**
 * Маппинг статусов для каждой вкладки
 */
const STATUS_GROUPS: StatusGroup = {
    all: ['ACTIVE', 'INACTIVE', 'DRAFT', 'PENDING', 'REJECTED'],
    active: ['ACTIVE'],
    inactive: ['INACTIVE'],
    pending: ['DRAFT', 'PENDING', 'REJECTED'],
};

/**
 * Интерфейс для конфигурации вкладки
 */
interface TabConfig {
    key: TabType;
    label: string;
    statuses: ListingStatus[];
}

/**
 * Конфигурация вкладок
 */
const TABS: TabConfig[] = [
    { key: 'all', label: 'Все', statuses: STATUS_GROUPS.all },
    { key: 'active', label: 'Активные', statuses: STATUS_GROUPS.active },
    { key: 'inactive', label: 'Неактивные', statuses: STATUS_GROUPS.inactive },
    { key: 'pending', label: 'На проверке', statuses: STATUS_GROUPS.pending },
];

export const ListingsScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();
    const [listings, setListings] = useState<ListingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    /**
     * Загрузка объявлений с сервера
     */
    const loadListings = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await listingApiService.getMyListings();
            setListings(response);
        } catch (error) {
            console.error('❌ Error loading listings:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить объявления');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    /**
     * Загрузка при фокусе экрана
     */
    useFocusEffect(
        useCallback(() => {
            loadListings();
        }, [loadListings])
    );

    /**
     * Обработчик обновления списка
     */
    const handleRefresh = () => {
        setRefreshing(true);
        loadListings();
    };

    /**
     * Обработчик нажатия на объявление
     */
    const handleListingPress = (listing: ListingResponse) => {
        navigation.navigate('Advertisement', { listingId: listing.id });
    };

    /**
     * Обработчик создания нового объявления
     */
    const handleCreateListing = () => {
        navigation.navigate('AddAdvertisement');
    };

    /**
     * Получение цвета для статуса
     */
    const getStatusColor = (status: ListingStatus): string => {
        switch (status) {
            case 'ACTIVE':
                return COLORS.green[500];
            case 'INACTIVE':
                return COLORS.gray[500];
            case 'DRAFT':
                return COLORS.orange[300];
            case 'PENDING':
                return COLORS.orange[400];
            case 'REJECTED':
                return COLORS.red[500];
            default:
                return COLORS.gray[500];
        }
    };

    /**
     * Получение текста статуса
     */
    const getStatusText = (status: ListingStatus): string => {
        switch (status) {
            case 'ACTIVE':
                return 'Активно';
            case 'INACTIVE':
                return 'Неактивно';
            case 'DRAFT':
                return 'Черновик';
            case 'PENDING':
                return 'На проверке';
            case 'REJECTED':
                return 'Отклонено';
            default:
                return status;
        }
    };

    /**
     * Получение иконки для статуса
     */
    const getStatusIcon = (status: ListingStatus): keyof typeof Ionicons.glyphMap => {
        switch (status) {
            case 'ACTIVE':
                return 'checkmark-circle';
            case 'INACTIVE':
                return 'close-circle';
            case 'DRAFT':
                return 'create';
            case 'PENDING':
                return 'time';
            case 'REJECTED':
                return 'alert-circle';
            default:
                return 'help-circle';
        }
    };

    /**
     * Получение иконки для типа объявления
     */
    const getListingTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'PARKING':
                return 'car';
            case 'GARAGE':
                return 'home';
            case 'STORAGE':
                return 'archive';
            default:
                return 'business';
        }
    };

    /**
     * Фильтрация объявлений по активной вкладке
     */
    const filteredListings = listings.filter(listing => {
        const activeTabConfig = TABS.find(tab => tab.key === activeTab);
        return activeTabConfig?.statuses.includes(listing.status as ListingStatus) ?? true;
    });

    /**
     * Рендер карточки объявления
     */
    const renderListingCard = (listing: ListingResponse) => {
        const statusColor = getStatusColor(listing.status as ListingStatus);
        const statusText = getStatusText(listing.status as ListingStatus);
        const statusIcon = getStatusIcon(listing.status as ListingStatus);
        const typeIcon = getListingTypeIcon(listing.type);

        return (
            <TouchableOpacity
                key={listing.id}
                style={styles.listingCard}
                onPress={() => handleListingPress(listing)}
            >
                {/* Изображение или плейсхолдер */}
                {listing.photosJson && listing.photosJson.length > 0 ? (
                    <Image
                        source={{ uri: listing.photosJson[0] }}
                        style={styles.listingImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.listingImage, styles.noImage]}>
                        <Ionicons name="image-outline" size={32} color={COLORS.gray[400]} />
                    </View>
                )}

                {/* Контент */}
                <View style={styles.listingContent}>
                    {/* Заголовок и тип */}
                    <View style={styles.listingHeader}>
                        <View style={styles.titleContainer}>
                            <Ionicons name={typeIcon} size={16} color={COLORS.primary} />
                            <Text style={styles.listingTitle} numberOfLines={1}>
                                {listing.title || `Объявление #${listing.id}`}
                            </Text>
                        </View>
                    </View>

                    {/* Адрес */}
                    <Text style={styles.listingAddress} numberOfLines={1}>
                        {listing.address || 'Адрес не указан'}
                    </Text>

                    {/* Цена и статус */}
                    <View style={styles.listingFooter}>
                        <Text style={styles.listingPrice}>
                            {listing.price ? formatPriceWithCurrency(listing.price, listing.currency || '₽') : 'Цена не указана'}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Ionicons name={statusIcon} size={12} color={COLORS.white} />
                            <Text style={styles.statusText}>{statusText}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Мои объявления</Text>
                <TouchableOpacity onPress={handleCreateListing} style={styles.createButton}>
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Вкладки */}
            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Список объявлений */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {filteredListings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color={COLORS.gray[400]} />
                        <Text style={styles.emptyStateTitle}>Объявлений нет</Text>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'all'
                                ? 'У вас пока нет объявлений'
                                : `Нет объявлений со статусом "${TABS.find(t => t.key === activeTab)?.label}"`}
                        </Text>
                    </View>
                ) : (
                    filteredListings.map(renderListingCard)
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
        marginTop: 50,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    createButton: {
        padding: 4,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    tabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: COLORS.gray[100],
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        color: COLORS.gray[600],
        fontWeight: '500',
    },
    activeTabText: {
        color: COLORS.white,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.gray[500],
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.gray[500],
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 32,
    },
    createFirstButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createFirstButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    listingCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        marginBottom: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    listingImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    noImage: {
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray[200],
    },
    listingContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    listingHeader: {
        marginBottom: 4,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    listingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    listingAddress: {
        fontSize: 13,
        color: COLORS.gray[500],
        marginBottom: 8,
    },
    listingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        color: COLORS.white,
        fontWeight: '600',
    },
});