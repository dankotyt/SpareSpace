import React from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text } from 'react-native';
import { Header } from '@/features/main/ui/Header/Header';
import { CategoryHints } from '@/features/main/ui/CategoryHints/CategoryHints';
import { BottomToolbar } from '@/shared/ui/BottomToolbar/BottomToolbar';

interface AdItem {
    id: string;
    price: string;
    type: string;
    location: string;
    image?: string;
}

interface MainLayoutProps {
    categories: any[];
    ads: AdItem[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
                                                          categories,
                                                          ads,
                                                          selectedCategory,
                                                          onCategorySelect,
                                                      }) => {
    const renderAdItem = ({ item }: { item: AdItem }) => (
        <View style={styles.adItem}>
            <View style={styles.imagePlaceholder}>
                <Text style={styles.imageText}>📷</Text>
            </View>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.location}>{item.location}</Text>
        </View>
    );

    const renderAdsGrid = () => (
        <View style={styles.adsContainer}>
            <FlatList
                data={ads}
                renderItem={renderAdItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.adsGrid}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <Header />

            <FlatList
                data={[]}
                renderItem={null}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <CategoryHints
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategorySelect={onCategorySelect}
                        />
                        {renderAdsGrid()}
                    </>
                }
                style={styles.scrollView}
            />

            <BottomToolbar />
        </View>
    );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 48 = 16*2 (padding) + 8*2 (margin)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    adsContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    adsGrid: {
        paddingBottom: 80,
    },
    categoriesHeader: {
        marginBottom: 20,
        zIndex: 5,
    },
    adItem: {
        width: itemWidth,
        marginBottom: 16,
        marginHorizontal: 4,
    },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    imageText: {
        fontSize: 24,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#202020',
        marginBottom: 4,
    },
    type: {
        fontSize: 14,
        fontWeight: '500',
        color: '#202020',
        marginBottom: 2,
    },
    location: {
        fontSize: 14,
        color: '#6B7280',
    },
});