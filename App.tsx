import React from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/services/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdvertisementProvider } from '@services/AdvertisementContext';

export default function App() {
    return (
        <AdvertisementProvider>
            <SafeAreaProvider>
                <AuthProvider>
                    <AppNavigator />
                </AuthProvider>
            </SafeAreaProvider>
        </AdvertisementProvider>
    );
}