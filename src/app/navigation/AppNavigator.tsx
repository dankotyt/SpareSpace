import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/features/auth';
import { PhoneAuthScreen, EmailAuthScreen } from '@/pages/auth';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    const { currentScreen } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={currentScreen === 'phone' ? 'Phone' : 'Email'}
            >
                <Stack.Screen name="Phone" component={PhoneAuthScreen} />
                <Stack.Screen name="Email" component={EmailAuthScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};