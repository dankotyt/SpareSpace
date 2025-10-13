import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
    MainTabs: undefined;
    PhoneAuth: undefined;
    EmailAuth: undefined;
    Profile: undefined;
};

export type NavigationProps = {
    navigate: (screen: keyof RootStackParamList) => void;
    goBack: () => void;
    replace: (screen: keyof RootStackParamList) => void;
};

export type BottomTabParamList = {
    MainScreen: undefined;
    Favorites: undefined;
    Search: undefined;
    Messages: undefined;
    Profile: undefined;
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PhoneAuth: undefined;
    EmailAuth: undefined;
};
