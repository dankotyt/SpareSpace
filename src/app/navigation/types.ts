import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
    Phone: undefined;
    Email: undefined;
};

export type NavigationProps = {
    navigate: (screen: keyof RootStackParamList) => void;
    goBack: () => void;
    replace: (screen: keyof RootStackParamList) => void;
};