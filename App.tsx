import React from 'react';
import { AppNavigator } from '@/app/navigation/AppNavigator';
import { AuthProvider } from '@/features/auth';

export default function App() {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}