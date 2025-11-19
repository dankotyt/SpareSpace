import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/types/chat';
import { COLORS } from '@/shared/constants/colors';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
                                                                message,
                                                                isOwn
                                                            }) => {
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <View style={[
            styles.messageContainer,
            isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
            <View style={[
                styles.bubble,
                isOwn ? styles.ownBubble : styles.otherBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    isOwn ? styles.ownMessageText : styles.otherMessageText
                ]}>
                    {message.text}
                </Text>
                <Text style={[
                    styles.timeText,
                    isOwn ? styles.ownTimeText : styles.otherTimeText
                ]}>
                    {formatTime(message.sentAt)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    messageContainer: {
        marginVertical: 4,
        paddingHorizontal: 16,
    },
    ownMessageContainer: {
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    ownBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: COLORS.primaryLight,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    ownMessageText: {
        color: COLORS.white,
    },
    otherMessageText: {
        color: COLORS.text,
    },
    timeText: {
        fontSize: 11,
        marginTop: 4,
        opacity: 0.7,
    },
    ownTimeText: {
        color: COLORS.white,
        textAlign: 'right',
    },
    otherTimeText: {
        color: COLORS.text,
        textAlign: 'left',
    },
});