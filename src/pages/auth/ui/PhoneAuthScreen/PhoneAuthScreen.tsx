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
import { StackNavigationProp } from '@react-navigation/stack';
import { PhoneInput, AuthButton, SupportLink } from '@/features/auth';
import { BackButton } from '@/shared/ui/BackButton/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/app/styles/global';
import { RootStackParamList } from '@/app/navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const PhoneAuthScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const {
        phone,
        isFocused,
        isValid,
        setPhone,
        setFocus,
        switchScreen,
        login,
    } = useAuth();

    const handleLogin = () => {
        console.log('Login with phone:', phone);
        login(); // Вызов функции авторизации
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        });
    };

    const handleSwitchToEmail = () => {
        switchScreen('email');
        navigation.navigate('EmailAuth');
    };

    const handleBack = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        });
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

                        <BackButton onPress={handleBack} />

                        <Text style={styles.title}>Вход или регистрация</Text>

                        <PhoneInput
                            value={phone}
                            isFocused={isFocused}
                            onChangeText={setPhone}
                            onFocus={() => setFocus(true)}
                            onBlur={() => setFocus(false)}
                        />

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
        alignSelf: 'flex-start',
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