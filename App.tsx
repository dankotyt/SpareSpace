import React from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/services/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
}