import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/services/AuthProvider';
import { AdvertisementProvider } from '@/services/AdvertisementContext';
import { useAuth } from '@hooks/auth/useAuth';

const DeepLinkHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { updateTelegramToken } = useAuth();

    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const { url } = event;

            if (url.includes('telegram-auth-success')) {
                try {
                    const urlParams = new URLSearchParams(url.split('?')[1]);
                    const token = urlParams.get('token');
                    const telegramId = urlParams.get('telegramId');

                    if (token) {
                        await updateTelegramToken(token, telegramId || undefined);
                    }
                } catch (error) {
                    console.error('Error handling deep link:', error);
                }
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        Linking.getInitialURL().then(url => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
        };
    }, [updateTelegramToken]);

    return <>{children}</>;
};

export default function App() {
    return (
        <AuthProvider>
            <AdvertisementProvider>
                <NavigationContainer
                    linking={{
                        prefixes: ['your-app://', 'https://your-domain.com'],
                        config: {
                            screens: {
                                TelegramAuth: 'telegram-auth',
                            },
                        },
                    }}
                >
                    <DeepLinkHandler>
                        <StatusBar style="auto" />
                        <AppNavigator />
                    </DeepLinkHandler>
                </NavigationContainer>
            </AdvertisementProvider>
        </AuthProvider>
    );
}