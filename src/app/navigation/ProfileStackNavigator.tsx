import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from './types';
import { PhoneAuthScreen, EmailAuthScreen } from '@/pages/auth';
import { MainScreen } from '@/pages/main';

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={MainScreen} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
        </Stack.Navigator>
    );
};