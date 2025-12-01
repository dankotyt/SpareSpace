import React, {useState, useCallback, useEffect} from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { AdvertisementCard } from '@components/advertisement/AdvertisementCard';
import { COLORS } from '@shared/constants/colors';
import { Listing } from "@/types/profile";
import { RootStackParamList } from "@navigation/types";
import { listingApiService } from "@services/api/listingApi";

export const AdvertisementScreen: React.FC = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'Advertisement'>>();
    const navigation = useNavigation();
    const { listingId } = route.params;

    const [listing, setListing] = useState<Listing | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadListing = async () => {
            try {
                setLoading(true);
                const listingData = await listingApiService.getListingById(listingId);
                setListing(listingData);
            } catch (error) {
                console.error('❌ Error loading listing:', error);
                Alert.alert('Ошибка', 'Не удалось загрузить объявление');
            } finally {
                setLoading(false);
            }
        };

        loadListing();
    }, [listingId]);

    const handleContactPress = useCallback(() => {
        if (!listing) return;

        Alert.alert('Контакт', `Позвонить по номеру: ${listing.contact?.phone || 'не указан'}`);
    }, [listing]);

    const handleFavoritePress = useCallback(() => {
        setIsFavorite(prev => !prev);
        // Здесь будет API вызов для добавления в избранное
    }, []);

    const handleBackPress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    if (loading) {
        return (
            <View style={styles.container}>
                {/* Добавь компонент загрузки */}
            </View>
        );
    }

    if (!listing) {
        return (
            <View style={styles.container}>
                {/* Ошибка - объявление либо удалено, либо скрыто */}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AdvertisementCard
                listing={listing}
                onContactPress={handleContactPress}
                onFavoritePress={handleFavoritePress}
                onBackPress={handleBackPress}
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