import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar, TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@react-navigation/native';
import { EmailInput, PasswordInput, AuthButton, SupportLink } from '@/features/auth';
import { BackButton } from '@/shared/ui/BackButton/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/app/styles/global';

const useTypedNavigation = () => {
    const navigation = useNavigation();
    return {
        navigateToEmail: () => navigation.navigate('Email' as never),
        navigateToPhone: () => navigation.navigate('Phone' as never),
        goBack: () => navigation.goBack(),
    };
};

export const EmailAuthScreen: React.FC = () => {
    const { goBack } = useTypedNavigation();
    const {
        email,
        password,
        isFocused,
        isValid,
        setEmail,
        setPassword,
        setFocus,
        switchScreen,
    } = useAuth();

    const handleLogin = () => {
        console.log('Login with email:', email);
    };

    const handleBack = () => {
        switchScreen('phone');
        goBack();
    };

    const handleRegister = () => {
        console.log('Navigate to registration');
    };

    const handleForgotPassword = () => {
        console.log('Navigate to forgot password');
    };

    const handleSupport = () => {
        console.log('Contact support');
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
                        <BackButton onPress={handleBack} />

                        <Text style={styles.title}>Вход или регистрация</Text>

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
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonsContainer}>
                            <AuthButton
                                title="Войти"
                                onPress={handleLogin}
                                disabled={!isValid}
                                variant="primary"
                            />

                            {/*<AuthButton*/}
                            {/*    title="Другой способ входа"*/}
                            {/*    onPress={handleSwitchToPhone}*/}
                            {/*    variant="outline"*/}
                            {/*/>*/}

                            <AuthButton
                                title="Зарегистрироваться"
                                onPress={handleRegister}
                                variant="outline"
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
        alignSelf: 'flex-start', // В левом углу
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
});