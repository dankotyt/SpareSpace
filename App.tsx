import React from 'react';
import { AppNavigator } from '@/app/navigation/AppNavigator';
import { AuthProvider } from '@/features/auth';
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