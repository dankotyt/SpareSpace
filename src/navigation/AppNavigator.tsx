import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { PhoneAuthScreen } from '@/screens/auth/PhoneAuthScreen';
import { EmailAuthScreen } from '@/screens/auth/EmailAuthScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RootStackParamList } from './types';
import {AddAdvertisementScreen} from "@/screens/addAdvertisement/AddAdvertisementScreen";

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="MainTabs"
            >
                <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
                <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
                <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen
                    name="AddAdvertisement"
                    component={AddAdvertisementScreen}
                    options={{
                        headerShown: false,
                        presentation: 'modal',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};