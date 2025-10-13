import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@react-navigation/native';
import { PhoneInput, AuthButton, SupportLink } from '@/features/auth';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/app/styles/global';

const useTypedNavigation = () => {
    const navigation = useNavigation();
    return {
        navigateToEmail: () => navigation.navigate('Email' as never),
        goBack: () => navigation.goBack(),
    };
};

export const PhoneAuthScreen: React.FC = () => {
    const { navigateToEmail } = useTypedNavigation();
    const {
        phone,
        isFocused,
        isValid,
        setPhone,
        setFocus,
        switchScreen,
    } = useAuth();

    const handleLogin = () => {
        console.log('Login with phone:', phone);
    };

    const handleSwitchToEmail = () => {
        switchScreen('email');
        navigateToEmail();
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
                        keyboardShouldPersistTaps="handled">
                        <Text style={styles.title}>Вход или регистрация</Text>

                        <PhoneInput
                            value={phone}
                            isFocused={isFocused}
                            onChangeText={setPhone}
                            onFocus={() => setFocus(true)}
                            onBlur={() => setFocus(false)}
                        />

                        {/* Кнопки входа */}
                        <View style={styles.buttonsContainer}>
                            <AuthButton
                                title="Войти"
                                onPress={handleLogin}
                                disabled={!isValid}
                                variant="primary"
                            />

                            <AuthButton
                                title="Другой способ входа"
                                onPress={handleSwitchToEmail}
                                variant="outline"
                            />
                        </View>
                    </ScrollView>
                </View>

                {/* Кнопка поддержки в самом низу */}
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
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 60,
        marginBottom: 20,
        alignSelf: 'flex-start', // В левом углу
    },
    buttonsContainer: {
        marginTop: 30,
        marginBottom: 0,
    },
    supportContainer: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
});