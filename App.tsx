import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/services/AuthProvider';
import { AdvertisementProvider } from '@/services/AdvertisementContext';

export default function App() {
    return (
        <AuthProvider>
            <AdvertisementProvider>
                <NavigationContainer>
                    <StatusBar style="auto" />
                    <AppNavigator />
                </NavigationContainer>
            </AdvertisementProvider>
        </AuthProvider>
    );
}