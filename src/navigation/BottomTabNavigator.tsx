import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainScreen } from '@/screens/main/MainScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { MapScreen } from '@/screens/map/MapScreen';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { ConversationsScreen } from '@/screens/chat/ConversationsScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { BottomTabParamList, ChatStackParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();

const ChatNavigator: React.FC = () => {
    return (
        <ChatStack.Navigator screenOptions={{ headerShown: false }}>
            <ChatStack.Screen name="Conversations" component={ConversationsScreen} />
            <ChatStack.Screen name="Chat" component={ChatScreen} />
            <ChatStack.Screen name="Auth" component={AuthScreen} />
        </ChatStack.Navigator>
    );
};

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
            <Tab.Screen name="Search" component={MapScreen} />
            <Tab.Screen name="Messages" component={ChatNavigator} />
        </Tab.Navigator>
    );
};