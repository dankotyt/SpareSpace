import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';

export const Header: React.FC = () => {
    return (
        <View style={styles.header}>
            <View style={styles.topRow}>
                <TouchableOpacity>
                    <Text style={styles.addButtonText}>+ Добавить объявление</Text>
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

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Что будем искать?"
                    placeholderTextColor="#9CA3AF"
                />
            </View>
        </View>
    );
};

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
    icon: {
        fontSize: 20,
        color: COLORS.primary,
    },
});