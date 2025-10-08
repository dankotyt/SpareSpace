import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/features/auth';
import { PhoneAuthScreen } from '@/pages/auth/ui/PhoneAuthScreen/PhoneAuthScreen';
import { EmailAuthScreen } from '@/pages/auth/ui/EmailAuthScreen/EmailAuthScreen';

export const AuthProcess: React.FC = () => {
    const { currentScreen } = useAuth();

    return (
        <View style={{ flex: 1 }}>
            {currentScreen === 'phone' && <PhoneAuthScreen />}
            {currentScreen === 'email' && <EmailAuthScreen />}
        </View>
    );
};