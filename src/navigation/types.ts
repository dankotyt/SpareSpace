import {AdvertisementFormData, LocationData} from "@/types/advertisement";
import {Listing} from "@/types/profile";
import {ListingResponse} from "@services/api/listingApi";

export type RootStackParamList = {
    MainTabs: undefined;
    PhoneAuth: undefined;
    EmailAuth: undefined;
    Registration: undefined;
    Profile: { userId?: number };
    FavoritesScreen: undefined;
    SearchScreen: undefined;
    MapScreen: {
        filterType?: string;
        searchQuery?: string;
        pricePeriod?: string;
        listing?: ListingResponse;
    };
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
    Advertisement: { listingId: number };
    Chat: { conversationId: number; };
    Conversations: undefined;
};

export type BottomTabParamList = {
    MainScreen: undefined;
    Favorites: undefined;
    Search: undefined;
    Messages: undefined;
    Profile: undefined;
    MapScreen: undefined;
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PhoneAuth: undefined;
    EmailAuth: undefined;
};

export type ChatStackParamList = {
    Conversations: undefined;
    Chat: { conversationId: number };
    Auth: undefined;
};
