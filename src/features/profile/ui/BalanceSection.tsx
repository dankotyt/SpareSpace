import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface BalanceSectionProps {
    balance: number;
    onTopUp: () => void;
    onWithdraw: () => void;
    onPromoCode: () => void;
    operations: () => void;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({
                                                                  balance,
                                                                  onTopUp,
                                                                  onWithdraw,
                                                                  onPromoCode,
                                                                  operations,
                                                              }) => {
    const formatBalance = (amount: number) => {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').replace('.', ',');
    };

    return (
        <View style={styles.container}>
            <View style={styles.balanceHeader}>
                <Text style={styles.sectionTitle}>Баланс</Text>
                <TouchableOpacity style={styles.promoButton} onPress={onPromoCode}>
                    <Text style={styles.promoButtonText}>Промокод</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.balanceAmount}>₽ {formatBalance(balance)}</Text>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.button} onPress={onTopUp}>
                    <Text style={styles.buttonText}>Пополнить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={onWithdraw}>
                    <Text style={[styles.buttonText, styles.outlineButtonText]}>Вывести</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={operations}>
                <Text style={styles.operationsText}>Операции</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        padding: 16,
        marginTop: 8,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    promoButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 6,
    },
    promoButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.green[500],
        marginBottom: 16,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButtonText: {
        color: COLORS.primary,
    },
    operationsText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
});