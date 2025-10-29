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
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
    EmailInput,
    PasswordInput,
    AuthButton,
    SupportLink,
    NameInput,
    SurnameInput,
    PatronymicInput,
    ConfirmPasswordInput,
} from '@/components/auth';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { BackButton } from '@/components/ui/BackButton';
import { COLORS } from '@/shared/constants/colors';
import { globalStyles } from '@/shared/constants/global';
import { RootStackParamList } from '@/navigation/types';
import { useRegistration } from '@/hooks/useRegistration';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const RegistrationScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const {
        registrationData,
        isFocused,
        currentField,
        errors,
        updateField,
        setFocus,
        isValid,
        isLoading,
        register,
        clearError,
    } = useRegistration();

    const handleContinue = async () => {
        try {
            const result = await register();

            if (result.success) {
                console.log('Registration successful');

                Alert.alert(
                    'Успешная регистрация!',
                    'Ваш аккаунт был успешно создан.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'MainTabs' }],
                                });
                            }
                        }
                    ]
                );
            } else {
                if (!result.message?.includes('email') && !result.message?.includes('phone')) {
                    Alert.alert('Ошибка', result.message || 'Произошла ошибка при регистрации');
                }
            }
        } catch (err) {
            console.log('Registration error:', err);
        }
    };

    const handleBack = () => {
        navigation.goBack();
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
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.headerTop}>
                            <BackButton onPress={handleBack} />
                        </View>

                        <Text style={styles.title}>Регистрация</Text>
                        <Text style={styles.subtitle}>
                            Заполните данные для создания аккаунта
                        </Text>

                        <NameInput
                            value={registrationData.first_name}
                            isFocused={isFocused && currentField === 'first_name'}
                            error={errors.first_name}
                            onChangeText={(text) => updateField('first_name', text)}
                            onFocus={() => setFocus(true, 'first_name')}
                            onBlur={() => setFocus(false)}
                        />

                        <SurnameInput
                            value={registrationData.last_name}
                            isFocused={isFocused && currentField === 'last_name'}
                            error={errors.last_name}
                            onChangeText={(text) => updateField('last_name', text)}
                            onFocus={() => setFocus(true, 'last_name')}
                            onBlur={() => setFocus(false)}
                        />

                        <PatronymicInput
                            value={registrationData.patronymic || ''}
                            isFocused={isFocused && currentField === 'patronymic'}
                            error={errors.patronymic}
                            onChangeText={(text) => updateField('patronymic', text)}
                            onFocus={() => setFocus(true, 'patronymic')}
                            onBlur={() => setFocus(false)}
                        />

                        <PhoneInput
                            value={registrationData.phone}
                            isFocused={isFocused && currentField === 'phone'}
                            error={errors.phone}
                            onChangeText={(text) => updateField('phone', text)}
                            onFocus={() => setFocus(true, 'phone')}
                            onBlur={() => setFocus(false)}
                        />

                        <EmailInput
                            value={registrationData.email}
                            isFocused={isFocused && currentField === 'email'}
                            error={errors.email}
                            onChangeText={(text) => updateField('email', text)}
                            onFocus={() => setFocus(true, 'email')}
                            onBlur={() => setFocus(false)}
                        />

                        <PasswordInput
                            value={registrationData.password}
                            isFocused={isFocused && currentField === 'password'}
                            error={errors.password}
                            onChangeText={(text) => updateField('password', text)}
                            onFocus={() => setFocus(true, 'password')}
                            onBlur={() => setFocus(false)}
                        />

                        <ConfirmPasswordInput
                            value={registrationData.confirmPassword}
                            password={registrationData.password}
                            isFocused={isFocused && currentField === 'confirmPassword'}
                            error={errors.confirmPassword}
                            onChangeText={(text) => updateField('confirmPassword', text)}
                            onFocus={() => setFocus(true, 'confirmPassword')}
                            onBlur={() => setFocus(false)}
                        />

                        <View style={styles.buttonsContainer}>
                            <AuthButton
                                title={isLoading ? "Регистрация..." : "Продолжить"}
                                onPress={handleContinue}
                                disabled={!isValid || isLoading}
                                variant="primary"
                                loading={isLoading}
                            />
                        </View>

                        <View style={styles.agreementContainer}>
                            <Text style={styles.agreementText}>
                                Нажимая «Продолжить», вы соглашаетесь с {' '}
                                <Text style={styles.link}>Пользовательским соглашением</Text>
                                {' '}и{' '}
                                <Text style={styles.link}>Политикой конфиденциальности</Text>
                            </Text>
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
        marginBottom: 30,
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
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.gray[500],
        marginBottom: 30,
        fontWeight: '500',
        alignSelf: 'flex-start',
    },
    buttonsContainer: {
        marginTop: 30,
        marginBottom: 20,
    },
    agreementContainer: {
        marginTop: 20,
        paddingHorizontal: 8,
    },
    agreementText: {
        fontSize: 12,
        color: COLORS.gray[500],
        textAlign: 'center',
        lineHeight: 16,
    },
    link: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    supportContainer: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
    errorText: {
        color: COLORS.red[600],
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
});