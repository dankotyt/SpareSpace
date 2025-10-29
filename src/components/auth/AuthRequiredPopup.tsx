import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface AuthRequiredPopupProps {
    visible: boolean;
    onClose: () => void;
    onNavigateToAuth: () => void;
}

export const AuthRequiredPopup: React.FC<AuthRequiredPopupProps> = ({
                                                                        visible,
                                                                        onClose,
                                                                        onNavigateToAuth,
                                                                    }) => {

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.popupContainer}>
                    <Text style={styles.title}>Требуется авторизация</Text>

                    <Text style={styles.message}>
                        Для добавления объявления необходимо войти в аккаунт или зарегистрироваться
                    </Text>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, styles.cancelButtonText]}>
                                Отмена
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.authButton]}
                            onPress={onNavigateToAuth}
                        >
                            <Text style={[styles.buttonText, styles.authButtonText]}>
                                Войти
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    popupContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: COLORS.gray[600],
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.gray[100],
        borderWidth: 1,
        borderColor: COLORS.gray[300],
    },
    authButton: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: COLORS.gray[700],
    },
    authButtonText: {
        color: COLORS.white,
    },
});