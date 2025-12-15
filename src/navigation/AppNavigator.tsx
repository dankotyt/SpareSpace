import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { PhoneAuthScreen } from '@/screens/auth/PhoneAuthScreen';
import { EmailAuthScreen } from '@/screens/auth/EmailAuthScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { MapScreen } from '@screens/map/MapScreen';
import { RootStackParamList } from './types';
import { AddAdvertisementScreen } from "@/screens/addAdvertisement/AddAdvertisementScreen";
import { RegistrationScreen } from '@/screens/auth/RegistrationScreen';
import SelectLocationScreen from "@screens/addAdvertisement/SelectLocationScreen";
import {AdvertisementScreen} from "@screens/addAdvertisement/AdvertisementScreen";
import { ChatScreen } from '@/screens/chat/ChatScreen';
import SearchScreen from "@screens/main/SearchScreen";
import { FavoritesScreen } from '@/screens/favorites/FavoritesScreen';
import {BookingsScreen} from "@screens/bookings/BookingsScreen";
import { BookingDetailsScreen } from '@/screens/bookings/BookingDetailsScreen';
import {LandlordBookingsScreen} from "@screens/bookings/LandlordBookingsScreen";

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
            <Stack.Screen
                name="Advertisement"
                component={AdvertisementScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Bookings"
                component={BookingsScreen}
                options={{ title: 'Мои бронирования' }}
            />
            <Stack.Screen
                name="BookingDetails"
                component={BookingDetailsScreen}
                options={{ title: 'Детали бронирования' }}
            />
            <Stack.Screen
                name="LandlordBookings"
                component={LandlordBookingsScreen}
                options={{ title: 'Заявки на бронирование' }}
            />
            <Stack.Screen
                name="SearchScreen"
                component={SearchScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="FavoritesScreen"
                component={FavoritesScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};