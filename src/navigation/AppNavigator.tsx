import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { PhoneAuthScreen } from '@/screens/auth/PhoneAuthScreen';
import { EmailAuthScreen } from '@/screens/auth/EmailAuthScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { MapScreen } from '@/screens/MapScreen';
import { RootStackParamList } from './types';
import { AddAdvertisementScreen } from "@/screens/addAdvertisement/AddAdvertisementScreen";
import { RegistrationScreen } from '@/screens/auth/RegistrationScreen';
import SelectLocationScreen from "@screens/addAdvertisement/SelectLocationScreen";

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="MainTabs"
        >
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="SelectLocationScreen" component={SelectLocationScreen} />
            <Stack.Screen
                name="AddAdvertisement"
                component={AddAdvertisementScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
};