import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import {useNavigation, RouteProp, useRoute} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@hooks/auth/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TelegramAuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TelegramAuth'>;
type TelegramAuthScreenRouteProp = RouteProp<RootStackParamList, 'TelegramAuth'>;

export const TelegramAuthScreen: React.FC = () => {
    const navigation = useNavigation<TelegramAuthScreenNavigationProp>();
    const route = useRoute<TelegramAuthScreenRouteProp>();
    const { link } = route.params;
    const { updateTelegramToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const webViewRef = useRef<WebView>(null);
    const insets = useSafeAreaInsets();

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        const { url } = navState;

        if (url.includes('telegram-auth-success')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const token = urlParams.get('token');
            const telegramId = urlParams.get('telegramId');

            if (token) {
                updateTelegramToken(token, telegramId || undefined);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
        }

        setLoading(!navState.loading);
    };

    const handleBack = () => {
        if (webViewRef.current?.goBack) {
            webViewRef.current.goBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <BackButton onPress={handleBack} color={COLORS.primary} />
                {loading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />}
            </View>

            <WebView
                ref={webViewRef}
                source={{ uri: link }}
                style={styles.webview}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    loader: {
        marginLeft: 16,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
});