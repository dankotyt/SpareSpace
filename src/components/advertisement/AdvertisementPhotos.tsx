import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    Dimensions,
    FlatList,
} from 'react-native';
import { COLORS } from '@/shared/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdvertisementPhotosProps {
    photos: string[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
}

export const AdvertisementPhotos: React.FC<AdvertisementPhotosProps> = ({
                                                                            photos,
                                                                            currentIndex,
                                                                            onIndexChange,
                                                                        }) => {
    const renderPhoto = ({ item }: { item: string }) => (
        <View style={styles.photoContainer}>
            <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
        </View>
    );

    if (photos.length === 0) {
        return (
            <View style={styles.placeholderContainer}>
                <View style={styles.placeholderPhoto} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={photos}
                renderItem={renderPhoto}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    onIndexChange(index);
                }}
            />

            {/* Индикатор фотографий */}
            {photos.length > 1 && (
                <View style={styles.indicatorContainer}>
                    {photos.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                {
                                    backgroundColor: index === currentIndex
                                        ? COLORS.primary
                                        : COLORS.white,
                                },
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray[200],
    },
    photoContainer: {
        width: SCREEN_WIDTH,
        height: '100%',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.gray[200],
    },
    placeholderPhoto: {
        width: '80%',
        height: '80%',
        backgroundColor: COLORS.gray[300],
        borderRadius: 8,
    },
    indicatorContainer: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        flexDirection: 'row',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
});