import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Alert,
    TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@hooks/auth/useAuth';
import { AuthButton } from '@/components/auth';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/shared/constants/global';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type VerificationRouteProp = RouteProp<RootStackParamList, 'SmsVerification'>;

export const SmsVerificationScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<VerificationRouteProp>();
    const { phone } = route.params;

    const { verifySmsCode, requestSmsCode, isLoading } = useAuth();
    const [code, setCode] = useState('');

    const handleVerify = async () => {
        if (code.length < 6) {
            Alert.alert('Ошибка', 'Введите 6-значный код');
            return;
        }

        try {
            const response = await verifySmsCode(code);

            if (response.requiresRegistration) {
                // Если не зарегистрирован -> на экран регистрации
                navigation.navigate('Registration');
            } else if (response.requiresTwoFactor) {
                // Если нужна 2FA (Экран 2FA можно создать позже)
                Alert.alert('Требуется 2FA', 'Введите код из приложения-аутентификатора (Экран в разработке)');
            } else if (response.accessToken) {
                // Успешный вход
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неверный код';
            Alert.alert('Ошибка', errorMessage);
        }
    };

    const handleResendCode = async () => {
        try {
            await requestSmsCode();
            Alert.alert('Успешно', 'Новый код отправлен');
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось отправить код повторно');
        }
    };

    return (
        <View style={globalStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.headerTop}>
                    <BackButton onPress={() => navigation.goBack()} color={COLORS.primary} backgroundColor={COLORS.transparent}/>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Введите код</Text>
                    <Text style={styles.subtitle}>
                        Код отправлен на номер {phone}
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="000000"
                            placeholderTextColor={COLORS.gray[300]}
                            autoFocus
                        />
                    </View>

                    <AuthButton
                        title={isLoading ? "Проверка..." : "Подтвердить"}
                        onPress={handleVerify}
                        disabled={code.length < 6 || isLoading}
                        variant="primary"
                        loading={isLoading}
                    />

                    <TouchableOpacity style={styles.resendContainer} onPress={handleResendCode} disabled={isLoading}>
                        <Text style={styles.resendText}>Отправить код повторно</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerTop: {
        marginTop: 60,
        marginBottom: 30,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.gray[500],
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 8,
        color: COLORS.text,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        paddingBottom: 8,
        width: '60%',
        textAlign: 'center',
    },
    resendContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    resendText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});
