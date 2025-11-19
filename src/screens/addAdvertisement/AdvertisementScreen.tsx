import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { AdvertisementCard } from '@components/advertisement/AdvertisementCard';
import { COLORS } from '@shared/constants/colors';
import { Listing } from "@types/profile";

type AdvertisementScreenRouteProp = RouteProp<{
    Advertisement: { listing: Listing };
}, 'Advertisement'>;

export const AdvertisementScreen: React.FC = () => {
    const route = useRoute<AdvertisementScreenRouteProp>();
    const navigation = useNavigation();
    const { listing } = route.params;

    const [isFavorite, setIsFavorite] = useState(false);

    const handleContactPress = useCallback(() => {
        // Здесь будет логика звонка
        Alert.alert('Контакт', `Позвонить по номеру: ${listing.contact?.phone || 'не указан'}`);
    }, [listing]);

    const handleFavoritePress = useCallback(() => {
        setIsFavorite(prev => !prev);
        // Здесь будет API вызов для добавления в избранное
    }, []);

    const handleBackPress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <AdvertisementCard
                listing={listing}
                onContactPress={handleContactPress}
                onFavoritePress={handleFavoritePress}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
});