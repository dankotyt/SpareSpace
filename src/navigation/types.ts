import {AdvertisementFormData, LocationData} from "@/types/advertisement";
import {Listing} from "@/types/profile";

export type RootStackParamList = {
    MainTabs: undefined;
    PhoneAuth: undefined;
    EmailAuth: undefined;
    Registration: undefined;
    Profile: undefined;
    MapScreen: { listing?: Listing };
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
    Advertisement: { listing: Listing };
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
