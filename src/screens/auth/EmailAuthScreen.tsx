import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    Alert, Linking,
} from 'react-native';
import { useAuth } from '@hooks/auth/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { EmailInput, PasswordInput, AuthButton, SupportLink } from '@/components/auth';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/shared/constants/global';
import { RootStackParamList } from '@/navigation/types';
import {TelegramButton} from "@components/auth/TelegramButton";
import {telegramApiService} from "@services/api/telegramApi";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const EmailAuthScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const {
        email,
        password,
        isFocused,
        isValid,
        isLoading,
        error,
        setEmail,
        setPassword,
        setFocus,
        switchScreen,
        login,
        clearError,
    } = useAuth();

    const handleLogin = async () => {
        try {
            const result = await login();

            if (result.success) {
                console.log('Login successful with token:', result.accessToken);

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
        } catch (error) {
            console.log('Login error:', error);
            // Ошибка уже установлена в useAuth, можно показать Alert
            const errorMessage = error instanceof Error ? error.message : 'Ошибка входа';
            Alert.alert('Ошибка входа', errorMessage);
        }
    };

    const handleBack = () => {
        switchScreen('phone');
        navigation.navigate('PhoneAuth');
    };

    const handleRegister = () => {
        console.log('Navigate to registration');
        navigation.navigate('Registration');
    };

    const handleForgotPassword = () => {
        console.log('Navigate to forgot password');
        // navigation.navigate('ForgotPassword');
    };

    const handleSupport = () => {
        console.log('Contact support');
    };

    const handleTelegramLogin = async () => {
        try {
            const response = await telegramApiService.generateTelegramLink();

            if (response.link) {
                Linking.openURL(response.link).catch(err =>
                    console.error('Failed to open URL:', err)
                );
            }
        } catch (error) {
            console.log('Telegram login error:', error);
            Alert.alert('Ошибка', 'Не удалось выполнить авторизацию через Telegram');
        }
    };

    return (
        <View style={globalStyles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={COLORS.white}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.mainContent}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.headerTop}>
                            <BackButton onPress={handleBack} color={COLORS.primary} backgroundColor={COLORS.transparent}/>
                        </View>

                        <Text style={styles.title}>Вход или регистрация</Text>

                        {error && (
                            <View >
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <EmailInput
                            value={email}
                            isFocused={isFocused}
                            onChangeText={setEmail}
                            onFocus={() => setFocus(true)}
                            onBlur={() => setFocus(false)}
                        />

                        <PasswordInput
                            value={password}
                            isFocused={isFocused}
                            onChangeText={setPassword}
                            onFocus={() => setFocus(true)}
                            onBlur={() => setFocus(false)}
                        />

                        <TouchableOpacity
                            style={styles.forgotPasswordContainer}
                            onPress={handleForgotPassword}>
                            <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonsContainer}>
                            <AuthButton
                                title={isLoading ? "Вход..." : "Войти"}
                                onPress={handleLogin}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                loading={isLoading}
                            />
                            <AuthButton
                                title="Зарегистрироваться"
                                onPress={handleRegister}
                                variant="outline"
                            />
                            <TelegramButton
                                onPress={handleTelegramLogin}
                                isLoading={isLoading}
                            />
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.supportContainer}>
                    <SupportLink onPress={handleSupport} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 60,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 0,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    buttonsContainer: {
        marginTop: 30,
        marginBottom: 0,
    },
    rowButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    supportContainer: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
    errorText: {
        color: COLORS.red[10],
        fontSize: 14,
        flex: 1,
        marginRight: 8,
        marginBottom: 10,
        fontWeight: '500',
    },
});