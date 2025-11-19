import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@shared/constants/colors';
import { RootStackParamList } from '@navigation/types';
import { BackButton } from '@components/ui/BackButton';
import { favoritesService, FavoriteItem, FavoriteListing, FavoriteSearch, FavoriteCollection } from '@services/favoritesService';
import { Listing } from '@/types/profile';
import { SearchHistoryItem } from '@services/search/searchHistoryService';
import {expandQueryWithSynonyms, normalizeQuery} from "@services/search/synonymService";

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FavoritesScreen'>;

type TabType = 'listings' | 'searches' | 'collections';

export const FavoritesScreen: React.FC = () => {
    const navigation = useNavigation<FavoritesScreenNavigationProp>();
    const [activeTab, setActiveTab] = useState<TabType>('listings');
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setIsLoading(true);
            const favs = await favoritesService.loadFavorites();
            setFavorites(favs);
        } catch (error) {
            console.error('❌ Ошибка загрузки избранного:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFavorite = async (id: string) => {
        try {
            const newFavorites = await favoritesService.removeFavorite(id);
            setFavorites(newFavorites);
        } catch (error) {
            console.error('❌ Ошибка при удалении из избранного:', error);
            Alert.alert('Ошибка', 'Не удалось удалить из избранного');
        }
    };

    const handleListingPress = (listing: Listing) => {
        navigation.navigate('AdvertisementScreen', { listing });
    };

    const handleSearchPress = (search: SearchHistoryItem) => {
        const normalizedQuery = normalizeQuery(search.label);
        const expandedQuery = expandQueryWithSynonyms(normalizedQuery);

        console.log('🔍 Избранный поиск:', {
            original: search.label,
            expanded: expandedQuery,
            type: search.type,
            period: search.pricePeriod
        });

        navigation.navigate('MapScreen', {
            filterType: search.type !== 'SEARCH' ? search.type : undefined,
            pricePeriod: search.pricePeriod,
            searchQuery: expandedQuery
        });
    };

    const handleCreateCollection = async () => {
        Alert.prompt(
            'Новая подборка',
            'Введите название подборки:',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Создать',
                    onPress: async (title: string | undefined) => {
                        if (title && title.trim()) {
                            const newFavorites = await favoritesService.createCollection(title.trim());
                            setFavorites(newFavorites);
                            setActiveTab('collections');
                        }
                    }
                },
            ],
            'plain-text'
        );
    };

    const favoriteListings = favorites.filter(
        (item): item is FavoriteListing => item.type === 'listing'
    );

    const favoriteSearches = favorites.filter(
        (item): item is FavoriteSearch => item.type === 'search'
    );

    const favoriteCollections = favorites.filter(
        (item): item is FavoriteCollection => item.type === 'collection'
    );

    const renderListingItem = ({ item }: { item: FavoriteListing }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => handleListingPress(item.data)}
        >
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.data.title}
                </Text>
                <TouchableOpacity
                    onPress={() => handleRemoveFavorite(item.id)}
                    style={styles.removeButton}
                >
                    <Ionicons name="heart" size={20} color={COLORS.red[50]} />
                </TouchableOpacity>
            </View>

            <Text style={styles.itemPrice}>
                {item.data.price.toLocaleString('ru-RU')} ₽/
                {item.data.pricePeriod === 'HOUR' ? 'час' :
                    item.data.pricePeriod === 'DAY' ? 'сутки' :
                        item.data.pricePeriod === 'WEEK' ? 'неделя' : 'месяц'}
            </Text>

            <Text style={styles.itemAddress} numberOfLines={1}>
                {item.data.address}
            </Text>

            <View style={styles.itemMeta}>
                <Text style={styles.itemType}>
                    {item.data.type === 'PARKING' ? 'Парковка' :
                        item.data.type === 'GARAGE' ? 'Гараж' : 'Кладовка'}
                </Text>
                <Text style={styles.itemDate}>
                    {new Date(item.addedAt).toLocaleDateString('ru-RU')}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderSearchItem = ({ item }: { item: FavoriteSearch }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => handleSearchPress(item.data)}
        >
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.data.label}
                </Text>
                <TouchableOpacity
                    onPress={() => handleRemoveFavorite(item.id)}
                    style={styles.removeButton}
                >
                    <Ionicons name="heart" size={20} color={COLORS.red[50]} />
                </TouchableOpacity>
            </View>

            <View style={styles.itemMeta}>
                <Text style={styles.itemType}>
                    {item.data.type === 'PARKING' ? 'Парковка' :
                        item.data.type === 'GARAGE' ? 'Гараж' :
                            item.data.type === 'STORAGE' ? 'Кладовка' : 'Поиск'}
                </Text>
                {item.data.pricePeriod && (
                    <Text style={styles.itemPeriod}>
                        {item.data.pricePeriod === 'HOUR' ? 'Почасово' :
                            item.data.pricePeriod === 'DAY' ? 'Посуточно' :
                                item.data.pricePeriod === 'WEEK' ? 'Понедельно' : 'Помесячно'}
                    </Text>
                )}
                <Text style={styles.itemDate}>
                    {new Date(item.addedAt).toLocaleDateString('ru-RU')}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderCollectionItem = ({ item }: { item: FavoriteCollection }) => (
        <TouchableOpacity style={styles.collectionCard}>
            <View style={styles.collectionHeader}>
                <Text style={styles.collectionTitle}>{item.title}</Text>
                <TouchableOpacity
                    onPress={() => handleRemoveFavorite(item.id)}
                    style={styles.removeButton}
                >
                    <Ionicons name="trash-outline" size={20} color={COLORS.gray[500]} />
                </TouchableOpacity>
            </View>

            {item.description && (
                <Text style={styles.collectionDescription}>{item.description}</Text>
            )}

            <View style={styles.collectionStats}>
                <Ionicons name="layers-outline" size={16} color={COLORS.gray[500]} />
                <Text style={styles.collectionCount}>
                    {item.items.length} элементов
                </Text>
                <Text style={styles.collectionDate}>
                    Создано {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name={activeTab === 'collections' ? 'layers-outline' : 'heart-outline'}
                size={64}
                color={COLORS.gray[300]}
            />
            <Text style={styles.emptyStateTitle}>
                {activeTab === 'listings' && 'Нет избранных объявлений'}
                {activeTab === 'searches' && 'Нет избранных поисков'}
                {activeTab === 'collections' && 'Нет подборок'}
            </Text>
            <Text style={styles.emptyStateText}>
                {activeTab === 'listings' && 'Добавляйте объявления в избранное, нажимая на сердечко'}
                {activeTab === 'searches' && 'Сохраняйте поисковые запросы для быстрого доступа'}
                {activeTab === 'collections' && 'Создавайте подборки для организации избранного'}
            </Text>
        </View>
    );

    // Отдельные FlatList для каждого типа данных
    const renderListings = () => (
        <FlatList
            data={favoriteListings}
            keyExtractor={(item) => item.id}
            renderItem={renderListingItem}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
    );

    const renderSearches = () => (
        <FlatList
            data={favoriteSearches}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
    );

    const renderCollections = () => (
        <FlatList
            data={favoriteCollections}
            keyExtractor={(item) => item.id}
            renderItem={renderCollectionItem}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.loadingState}>
                    <Text>Загрузка...</Text>
                </View>
            );
        }

        switch (activeTab) {
            case 'listings':
                return renderListings();
            case 'searches':
                return renderSearches();
            case 'collections':
                return renderCollections();
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} filled={true} />
                <Text style={styles.headerTitle}>Избранное</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
                        onPress={() => setActiveTab('listings')}
                    >
                        <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
                            Объявления ({favoriteListings.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'searches' && styles.tabActive]}
                        onPress={() => setActiveTab('searches')}
                    >
                        <Text style={[styles.tabText, activeTab === 'searches' && styles.tabTextActive]}>
                            Поиски ({favoriteSearches.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'collections' && styles.tabActive]}
                        onPress={() => setActiveTab('collections')}
                    >
                        <Text style={[styles.tabText, activeTab === 'collections' && styles.tabTextActive]}>
                            Подборки ({favoriteCollections.length})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'collections' && (
                    <TouchableOpacity
                        style={styles.createCollectionButton}
                        onPress={handleCreateCollection}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.createCollectionText}>Создать подборку</Text>
                    </TouchableOpacity>
                )}

                {renderContent()}
            </View>
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
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerPlaceholder: {
        width: 40,
    },
    tabContainer: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    tabScrollContent: {
        paddingHorizontal: 16,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 8,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray[500],
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    createCollectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    createCollectionText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    listContent: {
        flexGrow: 1,
    },
    itemCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    collectionCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    collectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    collectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    removeButton: {
        padding: 4,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    itemAddress: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginBottom: 8,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    itemType: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
        marginRight: 8,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    itemPeriod: {
        fontSize: 12,
        color: COLORS.green[500],
        fontWeight: '500',
        marginRight: 8,
    },
    itemDate: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    collectionDescription: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginBottom: 12,
        lineHeight: 20,
    },
    collectionStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    collectionCount: {
        fontSize: 12,
        color: COLORS.gray[500],
        marginLeft: 4,
        marginRight: 12,
    },
    collectionDate: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
});

export default FavoritesScreen;