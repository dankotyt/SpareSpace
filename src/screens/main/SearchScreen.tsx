import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@shared/constants/colors';
import { RootStackParamList } from '@navigation/types';
import { BackButton } from '@components/ui/BackButton';
import { searchHistoryService, SearchHistoryItem } from '@services/search/searchHistoryService';
import {listingApiService} from "@services/api/listingApi";
import {expandQueryWithSynonyms, normalizeQuery} from "@services/search/synonymService";

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SearchScreen'>;

const QUICK_ACTIONS = [
    {
        id: '1',
        type: 'GARAGE',
        label: 'Снять гараж',
        icon: 'car',
    },
    {
        id: '2',
        type: 'PARKING',
        label: 'Снять парковочное место',
        icon: 'location',
    },
    {
        id: '3',
        type: 'STORAGE',
        label: 'Снять кладовку',
        icon: 'archive',
    },
];

const extractPricePeriod = (text: string): string | undefined => {
    const textLower = text.toLowerCase();

    if (textLower.includes('посуточно') || textLower.includes('сутки') || textLower.includes('дневн')) {
        return 'DAY';
    }
    if (textLower.includes('почасов') || textLower.includes('час')) {
        return 'HOUR';
    }
    if (textLower.includes('помесяч') || textLower.includes('месяц')) {
        return 'MONTH';
    }
    if (textLower.includes('понедел') || textLower.includes('недел')) {
        return 'WEEK';
    }

    return undefined;
};

const isValidSearchQuery = (query: string): boolean => {
    if (!query || query.trim().length === 0) return false;

    if (query.trim().length < 2) return false;

    const hasMeaningfulChars = /[а-яa-z]/i.test(query);
    if (!hasMeaningfulChars) return false;

    return true;
};

export const SearchScreen: React.FC = () => {
    const navigation = useNavigation<SearchScreenNavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    // Загрузка истории поиска при монтировании
    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        const history = await searchHistoryService.loadSearchHistory();
        setSearchHistory(history);
    };

    const handleQuickActionPress = async (type: string, label: string) => {
        const pricePeriod = extractPricePeriod(label);

        // Проверяем есть ли результаты для этого запроса
        setIsChecking(true);
        const { hasResults, count } = await checkSearchResults(type, pricePeriod, label);
        setIsChecking(false);

        if (!hasResults) {
            showNoResultsAlert(label, count);
            return;
        }

        // Сохраняем в историю и переходим
        const newHistory = await searchHistoryService.addToHistory({
            type,
            timestamp: Date.now(),
            label,
            pricePeriod
        });

        setSearchHistory(newHistory);

        navigation.navigate('MapScreen', {
            filterType: type,
            pricePeriod: pricePeriod,
            searchQuery: label
        });
    };

    const handleHistoryItemPress = async (item: SearchHistoryItem) => {
        setIsChecking(true);
        const { hasResults, count } = await checkSearchResults(
            item.type !== 'SEARCH' ? item.type : undefined,
            item.pricePeriod,
            item.label
        );
        setIsChecking(false);

        if (!hasResults) {
            showNoResultsAlert(item.label, count);
            return;
        }

        navigation.navigate('MapScreen', {
            filterType: item.type !== 'SEARCH' ? item.type : undefined,
            pricePeriod: item.pricePeriod,
            searchQuery: item.label
        });
    };

    const handleSearchSubmit = async () => {
        if (!searchQuery.trim()) return;

        if (!isValidSearchQuery(searchQuery)) {
            Alert.alert(
                'Некорректный запрос',
                'Пожалуйста, введите более конкретный запрос для поиска',
                [{ text: 'Понятно' }]
            );
            return;
        }

        const normalizedQuery = normalizeQuery(searchQuery);
        const searchType = determineSearchType(normalizedQuery);
        const pricePeriod = extractPricePeriod(normalizedQuery);

        const expandedQuery = expandQueryWithSynonyms(normalizedQuery);

        console.log('🔍 Поисковый запрос:', {
            original: searchQuery,
            normalized: normalizedQuery,
            expanded: expandedQuery,
            type: searchType,
            period: pricePeriod
        });

        setIsChecking(true);
        const { hasResults, count } = await checkSearchResults(
            searchType !== 'SEARCH' ? searchType : undefined,
            pricePeriod,
            expandedQuery // Используем расширенный запрос
        );
        setIsChecking(false);

        if (!hasResults) {
            showNoResultsAlert(searchQuery, count);
            return;
        }

        const newHistory = await searchHistoryService.addToHistory({
            type: searchType,
            timestamp: Date.now(),
            label: searchQuery,
            pricePeriod
        });

        setSearchHistory(newHistory);

        navigation.navigate('MapScreen', {
            filterType: searchType !== 'SEARCH' ? searchType : undefined,
            pricePeriod: pricePeriod,
            searchQuery: expandedQuery
        });
    };

    const showNoResultsAlert = (query: string, count?: number) => {
        Alert.alert(
            'Ничего не найдено',
            `По запросу "${query}" не найдено подходящих объявлений.\n\nПопробуйте изменить параметры поиска.`,
            [
                {
                    text: 'Изменить запрос',
                    style: 'default'
                },
                {
                    text: 'Посмотреть все',
                    style: 'cancel',
                    onPress: () => navigation.navigate('MapScreen')
                }
            ]
        );
    };

    const determineSearchType = (text: string): string => {
        const textLower = text.toLowerCase();

        if (textLower.includes('гараж')) return 'GARAGE';
        if (textLower.includes('парков') || textLower.includes('стоянк')) return 'PARKING';
        if (textLower.includes('кладов') || textLower.includes('хранен')) return 'STORAGE';

        return 'SEARCH';
    };

    const clearSearchHistory = async () => {
        await searchHistoryService.clearHistory();
        setSearchHistory([]);
    };

    const removeHistoryItem = async (id: string) => {
        const newHistory = await searchHistoryService.removeFromHistory(id);
        setSearchHistory(newHistory);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'GARAGE': return 'home';
            case 'PARKING': return 'car';
            case 'STORAGE': return 'archive';
            default: return 'search';
        }
    };

    const getTypeLabel = (type: string): string => {
        switch (type) {
            case 'GARAGE': return 'Гараж';
            case 'PARKING': return 'Парковка';
            case 'STORAGE': return 'Кладовка';
            default: return 'Поиск';
        }
    };

    const getPeriodLabel = (period?: string): string => {
        switch (period) {
            case 'HOUR': return 'Почасово';
            case 'DAY': return 'Посуточно';
            case 'WEEK': return 'Понедельно';
            case 'MONTH': return 'Помесячно';
            default: return '';
        }
    };

    const formatTime = (timestamp: number): string => {
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / 3600000);

        if (hours < 1) return 'только что';
        if (hours < 24) return `${hours} ч назад`;

        const days = Math.floor(hours / 24);
        return `${days} д назад`;
    };

    const checkSearchResults = async (
        filterType?: string,
        pricePeriod?: string,
        searchQuery?: string
    ): Promise<{ hasResults: boolean; count?: number }> => {
        try {
            const listingsData = await listingApiService.getListings();

            let filteredListings = listingsData.filter(listing => {
                const isActive = listing.status === 'ACTIVE';
                const hasCoords = !!listing.location;
                return isActive && hasCoords;
            });

            if (filterType && filterType !== 'SEARCH') {
                filteredListings = filteredListings.filter(listing => listing.type === filterType);
            }

            if (pricePeriod) {
                filteredListings = filteredListings.filter(listing => listing.pricePeriod === pricePeriod);
            }

            if (searchQuery) {
                const searchTerms = searchQuery.toLowerCase().split(/\s+/);

                filteredListings = filteredListings.filter(listing => {
                    const searchText = `
          ${listing.title} 
          ${listing.description} 
          ${listing.address}
          ${getTypeLabel(listing.type)}
        `.toLowerCase();

                    return searchTerms.some(term =>
                        term.length > 2 && searchText.includes(term)
                    );
                });
            }

            return {
                hasResults: filteredListings.length > 0,
                count: filteredListings.length
            };
        } catch (error) {
            console.error('❌ Ошибка проверки результатов поиска:', error);
            return { hasResults: false };
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.backButton}>
                    <BackButton onPress={() => navigation.goBack()} filled={true} />
                </View>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.gray[500]} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Что будем искать?"
                        placeholderTextColor={COLORS.gray[500]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                        autoFocus={true}
                    />
                    {isChecking ? (
                        <Ionicons name="time-outline" size={20} color={COLORS.gray[500]} />
                    ) : searchQuery.length > 0 ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.gray[500]} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Быстрые действия */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Быстрый поиск</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickActionsContainer}
                    >
                        {QUICK_ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.quickAction}
                                onPress={() => handleQuickActionPress(action.type, action.label)}
                                disabled={isChecking}
                            >
                                <View style={[
                                    styles.quickActionIcon,
                                    isChecking && styles.quickActionIconDisabled
                                ]}>
                                    <Ionicons
                                        name={action.icon as any}
                                        size={24}
                                        color={isChecking ? COLORS.gray[400] : COLORS.primary}
                                    />
                                </View>
                                <Text style={[
                                    styles.quickActionText,
                                    isChecking && styles.quickActionTextDisabled
                                ]}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* История поиска */}
                {searchHistory.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>История поиска</Text>
                            <TouchableOpacity onPress={clearSearchHistory} disabled={isChecking}>
                                <Text style={[
                                    styles.clearButton,
                                    isChecking && styles.clearButtonDisabled
                                ]}>
                                    Очистить
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.historyList}>
                            {searchHistory.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.historyItem}
                                    onPress={() => handleHistoryItemPress(item)}
                                    disabled={isChecking}
                                >
                                    <View style={styles.historyItemLeft}>
                                        <View style={[
                                            styles.historyIcon,
                                            isChecking && styles.historyIconDisabled
                                        ]}>
                                            <Ionicons
                                                name={getTypeIcon(item.type) as any}
                                                size={16}
                                                color={isChecking ? COLORS.gray[400] : COLORS.primary}
                                            />
                                        </View>
                                        <View style={styles.historyContent}>
                                            <Text style={[
                                                styles.historyLabel,
                                                isChecking && styles.historyLabelDisabled
                                            ]}>
                                                {item.label}
                                            </Text>
                                            <View style={styles.historyMeta}>
                                                <Text style={[
                                                    styles.historyType,
                                                    isChecking && styles.historyTypeDisabled
                                                ]}>
                                                    {getTypeLabel(item.type)}
                                                </Text>
                                                {item.pricePeriod && (
                                                    <Text style={[
                                                        styles.historyPeriod,
                                                        isChecking && styles.historyPeriodDisabled
                                                    ]}>
                                                        {getPeriodLabel(item.pricePeriod)}
                                                    </Text>
                                                )}
                                                <Text style={styles.historyTime}>{formatTime(item.timestamp)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeHistoryItem(item.id)}
                                        style={styles.deleteButton}
                                        disabled={isChecking}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={16}
                                            color={isChecking ? COLORS.gray[400] : COLORS.gray[500]}
                                        />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Пустая история */}
                {searchHistory.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color={COLORS.gray[300]} />
                        <Text style={styles.emptyStateTitle}>История поиска пуста</Text>
                        <Text style={styles.emptyStateText}>
                            Используйте быстрый поиск или введите запрос в поле выше
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// Стили остаются такими же как в предыдущем примере...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    backButton: {
      marginTop: 20,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 32,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginLeft: 12,
        marginTop: 20,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    clearButton: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    clearButtonDisabled: {
        color: COLORS.gray[400],
    },
    quickActionsContainer: {
        paddingRight: 16,
    },
    quickAction: {
        alignItems: 'center',
        marginRight: 16,
        width: 100,
    },
    quickActionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionIconDisabled: {
        backgroundColor: COLORS.gray[200],
    },
    quickActionText: {
        fontSize: 12,
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
    quickActionTextDisabled: {
        color: COLORS.gray[400],
    },
    historyList: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    historyItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    historyIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyIconDisabled: {
        backgroundColor: COLORS.gray[200],
    },
    historyContent: {
        flex: 1,
    },
    historyLabel: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 4,
    },
    historyLabelDisabled: {
        color: COLORS.gray[400],
    },
    historyMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    historyType: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
        marginRight: 8,
    },
    historyTypeDisabled: {
        color: COLORS.gray[400],
    },
    historyPeriod: {
        fontSize: 12,
        color: COLORS.green[500],
        fontWeight: '500',
        marginRight: 8,
    },
    historyPeriodDisabled: {
        color: COLORS.gray[400],
    },
    historyTime: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    deleteButton: {
        padding: 4,
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
    },
});

export default SearchScreen;