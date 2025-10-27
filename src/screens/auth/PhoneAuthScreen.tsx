import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PhoneInput, AuthButton, SupportLink } from '@/components/auth';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/shared/constants/global';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const PhoneAuthScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const {
        phone,
        isFocused,
        isValid,
        isLoading,
        setPhone,
        setFocus,
        switchScreen,
        checkPhone,
        clearError,
    } = useAuth();

    const handlePhoneLogin = async () => {
        try {
            const result = await checkPhone();

            if (result.exists) {
                Alert.alert('Успешно', result.message);
                // Здесь можно перейти на экран ввода SMS кода
                // navigation.navigate('SmsVerification', { phone });
            } else {
                Alert.alert(
                    'Номер не найден',
                    result.message,
                    [
                        {
                            text: 'Зарегистрироваться',
                            onPress: () => navigation.navigate('Registration')
                        },
                        {
                            text: 'Отмена',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.log('Phone check error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Ошибка проверки номера';
            Alert.alert('Ошибка', errorMessage);
        }
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

                        <View style={styles.headerTop}>
                            <BackButton onPress={handleBack} />
                        </View>

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
                                title={isLoading ? "Проверка..." : "Продолжить"}
                                onPress={handlePhoneLogin}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                loading={isLoading}
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
    supportContainer: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
});