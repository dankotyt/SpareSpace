import {AdvertisementFormData, LocationData} from "@/types/advertisement";

export type RootStackParamList = {
    MainTabs: undefined;
    PhoneAuth: undefined;
    EmailAuth: undefined;
    Registration: undefined;
    Profile: undefined;
    MapScreen: undefined;
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
