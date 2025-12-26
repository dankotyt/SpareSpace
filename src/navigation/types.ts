import {LocationData} from "@/types/advertisement";
import {ListingResponse} from "@services/api/listingApi";

export type RootStackParamList = {
    // Главный таб-навигатор
    MainTabs: undefined;

    // Аутентификация
    PhoneAuth: undefined;
    EmailAuth: undefined;
    TelegramAuth: { link: string };
    Registration: undefined;

    // Профили
    Profile: { userId?: number };

    // Объявления
    Advertisement: { listingId: number };
    AddAdvertisement: {
        selectedLocation?: {
            latitude: number;
            longitude: number;
            address: string;
        };
        currentStep?: number;
    };
    SelectLocationScreen: {
        initialLocation?: {
            latitude: number;
            longitude: number;
        };
        onLocationSelected?: (locationData: LocationData) => void;
    };

    // Поиск и карты
    SearchScreen: undefined;
    MapScreen: {
        filterType?: string;
        searchQuery?: string;
        pricePeriod?: string;
        listing?: ListingResponse;
    };

    // Бронирования
    Bookings: { initialTab?: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' } | undefined;
    BookingDetails: { bookingId: number };
    LandlordBookings: undefined;

    // Чаты
    Conversations: undefined;
    Chat: { conversationId: number };

    // Избранное
    FavoritesScreen: undefined;
};

export type BottomTabParamList = {
    MainScreen: undefined;
    Favorites: undefined;
    Search: undefined;
    Messages: undefined;
    Profile: undefined;
    MapScreen: undefined;
};

export type ChatStackParamList = {
    Conversations: undefined;
    Chat: { conversationId: number };
    Auth: undefined;
};