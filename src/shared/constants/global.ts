import { StyleSheet } from 'react-native';
import { COLORS } from '@/shared/constants/colors';

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    screenPadding: {
        paddingHorizontal: 16,
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    screen: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
    },
});