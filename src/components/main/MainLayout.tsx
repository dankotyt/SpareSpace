import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    ListRenderItem,
    StyleSheet,
    Dimensions,
    Text,
    Animated,
    LayoutChangeEvent,
    RefreshControl,
    Image, TouchableOpacity,
} from 'react-native';
import { Header } from '@/components/main/Header';
import { CategoryHints } from '@/components/main/CategoryHints';
import { BottomToolbar } from '@/components/ui/BottomToolbar';
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "@navigation/types";
import {useNavigation} from "@react-navigation/native";
import {AdItem} from "@/types/main";

interface MainLayoutProps {
    categories: any[];
    ads: AdItem[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
                                                          categories,
                                                          ads,
                                                          selectedCategory,
                                                          onCategorySelect,
                                                          onRefresh,
                                                          isRefreshing,
                                                      }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [headerHeight, setHeaderHeight] = useState(0);
    const [categoriesHeight, setCategoriesHeight] = useState(0);
    const [bottomToolbarHeight, setBottomToolbarHeight] = useState(0);
    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

    const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<AdItem>);
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const maxTranslateY = categoriesHeight + 15;

    const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
        setHeaderHeight(event.nativeEvent.layout.height);
    }, []);

    const onCategoriesLayout = useCallback((event: LayoutChangeEvent) => {
        setCategoriesHeight(event.nativeEvent.layout.height);
    }, []);

    const onBottomToolbarLayout = useCallback((event: LayoutChangeEvent) => {
        setBottomToolbarHeight(event.nativeEvent.layout.height);
    }, []);

    const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
        setScreenHeight(event.nativeEvent.layout.height);
    }, []);

    const handleRefresh = useCallback(() => {
        console.log('Refresh started - state:', {
            headerHeight,
            categoriesHeight,
            bottomToolbarHeight,
            screenHeight,
            maxTranslateY,
            adsCount: ads?.length || 0,
            isRefreshing
        });

        onRefresh();
    }, [onRefresh, headerHeight, categoriesHeight, bottomToolbarHeight, screenHeight, maxTranslateY, ads, isRefreshing]);

    const renderRefreshControl = () => (
        <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#000000']}
            tintColor="#000000"
        />
    );

    const renderHeader = () => (
        <View>
            <Text style={styles.sectionTitle}>Вам может быть интересно</Text>
        </View>
    );

    const handleAdPress = useCallback((item: AdItem) => {
        navigation.navigate('Advertisement', {
            listing: item.originalData
        });
    }, [navigation]);

    const renderAdItem: ListRenderItem<AdItem> = ({ item }) => (
        <TouchableOpacity
            style={styles.adItem}
            onPress={() => handleAdPress(item)}
        >
            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.adImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageText}>📷</Text>
                </View>
            )}
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.location}>{item.location}</Text>
        </TouchableOpacity>
    );
    const swipeableContainerHeight = screenHeight - headerHeight - bottomToolbarHeight;

    return (
        <View style={styles.container} onLayout={onContainerLayout}>
            <View onLayout={onHeaderLayout}>
                <Header />
            </View>

            <View onLayout={onCategoriesLayout}>
                <CategoryHints
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={onCategorySelect}
                />
            </View>

            <Animated.View
                style={[
                    styles.swipeableContainer,
                    {
                        top: headerHeight + categoriesHeight,
                        height: Math.max(swipeableContainerHeight, 0),
                        transform: [{
                            translateY: isRefreshing ? 0 : scrollY.interpolate({
                                inputRange: [0, maxTranslateY],
                                outputRange: [0, -maxTranslateY],
                                extrapolate: 'clamp',
                            })
                        }]
                    },
                ]}
            >

                <View style={styles.homeIndicatorContainer}>
                    <View style={styles.homeIndicator} />
                </View>

                <AnimatedFlatList
                    ref={flatListRef}
                    data={ads}
                    renderItem={renderAdItem}
                    ListHeaderComponent={renderHeader}
                    keyExtractor={(item: AdItem) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.adsGrid}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    scrollEnabled={true}
                    refreshControl={renderRefreshControl()}
                    alwaysBounceVertical={true}
                    bounces={true}
                    overScrollMode="always"
                    style={styles.flatList}

                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                />
            </Animated.View>
            <View style={styles.bottomToolbarWrapper} onLayout={onBottomToolbarLayout}>
                <BottomToolbar />
            </View>
        </View>
    );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    debugText: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
    },
    adImage: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 8,
    },
    swipeableContainer: {
        width: '100%',
        marginTop: 15,
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 10,
    },
    bottomToolbarWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
    },
    homeIndicatorContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 5,
    },
    homeIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
    },
    refreshIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    flatList: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#202020',
        marginBottom: 10,
        marginLeft: 10,
    },
    adsGrid: {
        paddingHorizontal: 16,
        paddingBottom: 200,
        paddingTop: 8,
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