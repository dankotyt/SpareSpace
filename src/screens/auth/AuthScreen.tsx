import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { PhoneAuthScreen } from '@screens/auth/PhoneAuthScreen';
import { EmailAuthScreen } from '@screens/auth/EmailAuthScreen';

export const AuthScreen: React.FC = () => {
    const { currentScreen } = useAuth();

    return (
        <View style={{ flex: 1 }}>
            {currentScreen === 'phone' && <PhoneAuthScreen />}
            {currentScreen === 'email' && <EmailAuthScreen />}
        </View>
    );
};