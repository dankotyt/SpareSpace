import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/colors';
import { BottomTabParamList } from '@/navigation/types';

type NavigationProp = BottomTabNavigationProp<BottomTabParamList>;

export const BottomToolbar: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();

    const activeTab = route.name as keyof BottomTabParamList;

    const tabs = [
        {
            id: 'MainScreen' as keyof BottomTabParamList,
            label: 'Главная',
            icon: (color: string) => <Ionicons name="home-outline" size={22} color={color} />,
            iconActive: (color: string) => <Ionicons name="home" size={22} color={color} />
        },
        {
            id: 'Favorites' as keyof BottomTabParamList,
            label: 'Избранное',
            icon: (color: string) => <MaterialIcons name="favorite-outline" size={22} color={color} />,
            iconActive: (color: string) => <MaterialIcons name="favorite" size={22} color={color} />
        },
        {
            id: 'Search' as keyof BottomTabParamList,
            label: 'Поиск',
            icon: (color: string) => <Ionicons name="search-outline" size={22} color={color} />,
            iconActive: (color: string) => <Ionicons name="search" size={22} color={color} />
        },
        {
            id: 'Messages' as keyof BottomTabParamList,
            label: 'Сообщения',
            icon: (color: string) => <Ionicons name="chatbubble-outline" size={22} color={color} />,
            iconActive: (color: string) => <Ionicons name="chatbubble" size={22} color={color} />
        },
        {
            id: 'Profile' as keyof BottomTabParamList,
            label: 'Профиль',
            icon: (color: string) => <FontAwesome name="user-o" size={22} color={color} />,
            iconActive: (color: string) => <FontAwesome name="user" size={22} color={color} />
        },
    ];

    const handleTabPress = (tabId: keyof BottomTabParamList) => {
        navigation.navigate(tabId);
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const iconColor = isActive ? COLORS.primary : COLORS.borderEmpty;
                const textColor = isActive ? COLORS.primary : COLORS.borderEmpty;

                return (
                    <TouchableOpacity
                        key={tab.id as string}
                        style={styles.tab}
                        onPress={() => handleTabPress(tab.id)}
                    >
                        {isActive ? tab.iconActive(iconColor) : tab.icon(iconColor)}
                        <Text style={[
                            styles.tabLabel,
                            { color: textColor }
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderEmpty,
        paddingBottom: 10,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        flex: 1,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
});