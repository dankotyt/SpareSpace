import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    View,
    Text,
} from 'react-native';
import { COLORS } from '@/shared/constants/colors';

interface TelegramIconButtonProps {
    onPress: () => void;
    isLoading?: boolean;
    size?: number;
}

export const TelegramButton: React.FC<TelegramIconButtonProps> = ({
                                                                          onPress,
                                                                          isLoading = false,
                                                                          size = 50,
                                                                      }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Войти через:</Text>
            <TouchableOpacity
                style={[{ width: size, height: size }]}
                onPress={onPress}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Image
                        source={require('../../../assets/icons/telegram_logo.png')}
                        style={[
                            {
                                width: size * 0.8,
                                height: size * 0.8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 1,
                            }
                        ]}
                        resizeMode="contain"
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 16,
    },
    label: {
        fontSize: 16,
        color: COLORS.gray[600],
        marginBottom: 12,
        fontWeight: '500',
    },
});