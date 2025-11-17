import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    FlatList,
    TouchableOpacity,
    Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';
import { AdvertisementDetails } from './AdvertisementDetails';
import { BackButton } from '@/components/ui/BackButton';
import { useNavigation } from '@react-navigation/native';
import {Listing} from "@/types/profile";
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Константы для позиций
const INITIAL_DETAILS_VISIBLE = 190; // Начальная видимая часть деталей (пиксели)
const EXPANDED_DETAILS_POSITION = 70; // Позиция при раскрытии (от верха экрана)
const SCROLL_TRIGGER_POINT = SCREEN_HEIGHT * 0.4; // Точка момента скролла (40% экрана)

// Позиции
const MIN_DETAILS_TRANSLATE = SCREEN_HEIGHT - INITIAL_DETAILS_VISIBLE; // Начальная позиция
const EXPAND_TRIGGER_TRANSLATE = SCROLL_TRIGGER_POINT; // Точка переключения в режим скролла
const MAX_DETAILS_TRANSLATE = EXPANDED_DETAILS_POSITION; // Максимальная позиция при раскрытии

interface AdvertisementCardProps {
    listing: Listing;
    onContactPress: () => void;
    onFavoritePress: () => void;
}

export const AdvertisementCard: React.FC<AdvertisementCardProps> = ({
                                                                        listing,
                                                                        onContactPress,
                                                                        onFavoritePress,
                                                                    }) => {
    const navigation = useNavigation();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    const [canScrollDetails, setCanScrollDetails] = useState(false);

    // Анимации
    const detailsTranslateY = useRef(new Animated.Value(MIN_DETAILS_TRANSLATE)).current;
    const headerBackgroundOpacity = useRef(new Animated.Value(0)).current;

    // Refs для отслеживания состояния
    const currentDetailsTranslate = useRef(MIN_DETAILS_TRANSLATE);
    const isScrollingDetails = useRef(false);

    // Слушаем изменения позиции деталей
    detailsTranslateY.addListener(({ value }) => {
        currentDetailsTranslate.current = value;

        // Анимация фона хедера
        const progress = (MIN_DETAILS_TRANSLATE - value) / (MIN_DETAILS_TRANSLATE - MAX_DETAILS_TRANSLATE);
        headerBackgroundOpacity.setValue(Math.min(Math.max(progress, 0), 1));

        // Проверяем достигли ли точки момента скролла
        if (value <= EXPAND_TRIGGER_TRANSLATE && !isDetailsExpanded) {
            setIsDetailsExpanded(true);
            setCanScrollDetails(true);
        } else if (value > EXPAND_TRIGGER_TRANSLATE && isDetailsExpanded) {
            setIsDetailsExpanded(false);
            setCanScrollDetails(false);
        }
    });

    // PanResponder для деталей
    const detailsPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Реагируем только на вертикальные свайпы
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderMove: (_, gestureState) => {
                if (isScrollingDetails.current) return;

                const newTranslate = currentDetailsTranslate.current + gestureState.dy;

                if (gestureState.dy < 0) {
                    // Свайп ВВЕРХ - поднимаем детали
                    const translate = Math.max(newTranslate, MAX_DETAILS_TRANSLATE);
                    detailsTranslateY.setValue(translate);
                } else if (gestureState.dy > 0) {
                    // Свайп ВНИЗ - опускаем детали
                    const translate = Math.min(newTranslate, MIN_DETAILS_TRANSLATE);
                    detailsTranslateY.setValue(translate);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (isScrollingDetails.current) {
                    isScrollingDetails.current = false;
                    return;
                }

                const velocity = gestureState.vy;
                const isFastSwipe = Math.abs(velocity) > 0.5;

                if (isFastSwipe) {
                    // Быстрый свайп
                    if (velocity < 0) {
                        // Быстрый свайп вверх - полностью открываем
                        Animated.spring(detailsTranslateY, {
                            toValue: MAX_DETAILS_TRANSLATE,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 10,
                        }).start();
                    } else {
                        // Быстрый свайп вниз - закрываем
                        Animated.spring(detailsTranslateY, {
                            toValue: MIN_DETAILS_TRANSLATE,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 10,
                        }).start();
                    }
                } else {
                    // Медленный свайп - определяем ближайшую точку
                    if (currentDetailsTranslate.current < EXPAND_TRIGGER_TRANSLATE) {
                        // Выше точки момента - фиксируем в раскрытом состоянии
                        Animated.spring(detailsTranslateY, {
                            toValue: MAX_DETAILS_TRANSLATE,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 10,
                        }).start();
                    } else {
                        // Ниже точки момента - фиксируем в закрытом состоянии
                        Animated.spring(detailsTranslateY, {
                            toValue: MIN_DETAILS_TRANSLATE,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 10,
                        }).start();
                    }
                }
            },
        })
    ).current;

    // Обработчик скролла деталей
    const handleDetailsScroll = (event: any) => {
        if (!canScrollDetails) return;

        const offsetY = event.nativeEvent.contentOffset.y;

        // Если скроллим вниз и достигли верха
        if (offsetY <= 0 && event.nativeEvent.velocity?.y < 0) {
            isScrollingDetails.current = false;
            setCanScrollDetails(false);

            // Возвращаем детали в начальное положение
            Animated.spring(detailsTranslateY, {
                toValue: MIN_DETAILS_TRANSLATE,
                useNativeDriver: true,
                tension: 50,
                friction: 10,
            }).start();
        }
    };

    const handlePhotosScrollEnd = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const newIndex = Math.floor(offsetY / SCREEN_WIDTH);
        setCurrentPhotoIndex(newIndex);
    };

    const renderPhoto = ({ item, index }: { item: string; index: number }) => (
        <View style={styles.photoContainer}>
            <Image
                source={{ uri: item }}
                style={styles.photo}
                contentFit="cover"
                onError={(error) => {
                    console.log('Image load error for:', item, error);
                }}
            />
        </View>
    );

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleSharePress = () => {
        console.log('Share pressed');
    };

    const handleMenuPress = () => {
        console.log('Menu pressed');
    };

    const photos = listing.photosJson || [];
    const hasMultiplePhotos = photos.length > 1;

    // Очищаем слушатели
    React.useEffect(() => {
        return () => {
            detailsTranslateY.removeAllListeners();
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* Контейнер фотографий */}
            <Animated.FlatList
                data={photos}
                renderItem={renderPhoto}
                keyExtractor={(item, index) => `${item}-${index}`}
                style={styles.photosContainer}
                contentContainerStyle={{
                    height: photos.length * SCREEN_WIDTH,
                }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handlePhotosScrollEnd}
                onScrollEndDrag={handlePhotosScrollEnd}
                scrollEnabled={!isDetailsExpanded} // Блокируем скролл фото когда детали раскрыты
                alwaysBounceVertical={true}
                bounces={true}
                overScrollMode="always"
                snapToInterval={SCREEN_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
            />

            {/* Статичный хедер */}
            <View style={styles.staticHeader}>
                <Animated.View
                    style={[
                        styles.headerBackground,
                        { opacity: headerBackgroundOpacity }
                    ]}
                />
                <View style={styles.headerButtons}>
                    <BackButton onPress={handleBackPress} color={COLORS.white}/>
                    <View style={styles.rightButtons}>
                        <TouchableOpacity style={styles.headerButton} onPress={handleSharePress}>
                            <Ionicons name="share-outline" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={handleMenuPress}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Счетчик фотографий */}
            {hasMultiplePhotos && (
                <View style={styles.counterContainer}>
                    <View style={styles.counterBackground}>
                        <Text style={styles.counterText}>
                            {currentPhotoIndex + 1}/{photos.length}
                        </Text>
                    </View>
                </View>
            )}

            {/* Контейнер с деталями */}
            <Animated.View
                style={[
                    styles.detailsContainer,
                    {
                        transform: [{ translateY: detailsTranslateY }],
                        height: SCREEN_HEIGHT - EXPANDED_DETAILS_POSITION,
                    },
                ]}
                {...detailsPanResponder.panHandlers}
            >
                <View style={styles.dragHandle}>
                    <View style={styles.dragHandleLine} />
                </View>
                <View style={styles.detailsContent}>
                    <AdvertisementDetails
                        listing={listing}
                        onContactPress={onContactPress}
                        onFavoritePress={onFavoritePress}
                        onScroll={handleDetailsScroll}
                        scrollEnabled={canScrollDetails}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    photosContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: COLORS.gray[200],
    },
    photoContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    staticHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        zIndex: 100,
        paddingTop: 40,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.white,
    },
    headerButtons: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    rightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    counterContainer: {
        position: 'absolute',
        bottom: 200, // Над деталями в начальном положении
        right: 16,
        zIndex: 20,
    },
    counterBackground: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    counterText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    detailsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    dragHandle: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dragHandleLine: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.gray[300],
        borderRadius: 2,
    },
    detailsContent: {
        flex: 1,
    },
});