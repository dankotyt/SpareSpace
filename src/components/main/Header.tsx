// В существующий Header.tsx добавляем обработчик нажатия на поле поиска
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';
import { RootStackParamList } from "@/navigation/types";
import { AuthRequiredPopup } from '@/components/auth/AuthRequiredPopup';
import { useAuthCheck } from '@hooks/auth/useAuthCheck';

export const Header: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { checkAuth, isChecking } = useAuthCheck();
    const [showAuthPopup, setShowAuthPopup] = useState(false);

    const handleAddAdvertisement = async () => {
        const isAuthenticated = await checkAuth();

        if (isAuthenticated) {
            navigation.navigate('AddAdvertisement');
        } else {
            setShowAuthPopup(true);
        }
    };

    const handleNavigateToAuth = () => {
        setShowAuthPopup(false);
        navigation.navigate('PhoneAuth');
    };

    const handleClosePopup = () => {
        setShowAuthPopup(false);
    };

    const handleSearchPress = () => {
        navigation.navigate('SearchScreen');
    };

    return (
        <View style={styles.header}>
            <View style={styles.topRow}>
                <TouchableOpacity
                    onPress={handleAddAdvertisement}
                    disabled={isChecking}
                >
                    <Text style={[
                        styles.addButtonText,
                        isChecking && styles.addButtonTextDisabled
                    ]}>
                        {isChecking ? 'Проверка...' : '+ Добавить объявление'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.iconsContainer}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialIcons name="filter-list" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
                <View pointerEvents="none">
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Что будем искать?"
                        placeholderTextColor="#9CA3AF"
                        editable={false}
                    />
                </View>
            </TouchableOpacity>

            <AuthRequiredPopup
                visible={showAuthPopup}
                onClose={handleClosePopup}
                onNavigateToAuth={handleNavigateToAuth}
            />
        </View>
    );
};

// Стили остаются прежними...
const styles = StyleSheet.create({
    header: {
        backgroundColor: '#E9E5FF',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 15,
    },
    addButtonTextDisabled: {
        opacity: 0.5,
    },
    searchContainer: {
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    iconsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    iconButton: {
        padding: 8,
    },
});