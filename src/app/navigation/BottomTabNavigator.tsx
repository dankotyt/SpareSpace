import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from './types';
import { MainScreen } from '@/pages/main';
import { ProfileScreen } from '@/pages/profile';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
            }}
        >
            <Tab.Screen name="MainScreen" component={MainScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Favorites" component={MainScreen} />
            <Tab.Screen name="Search" component={MainScreen} />
            <Tab.Screen name="Messages" component={MainScreen} />
        </Tab.Navigator>
    );
};