import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/types/chat';
import { COLORS } from '@/shared/constants/colors';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showReadStatus?: boolean;
}

/**
 * React-компонент кнопки для авторизации через Telegram
 * Отображает логотип Telegram и состояние загрузки
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
                                                                message,
                                                                isOwn,
                                                                showReadStatus = false
                                                            }) => {
    const showDoubleCheck = isOwn && message.isRead;

    return (
        <View style={[
            styles.container,
            isOwn ? styles.ownContainer : styles.otherContainer
        ]}>
            <View style={[
                styles.bubble,
                isOwn ? styles.ownBubble : styles.otherBubble
            ]}>
                <Text style={isOwn ? styles.ownText : styles.otherText}>
                    {message.text}
                </Text>

                {/* Время и статус прочтения */}
                <View style={styles.footer}>
                    <Text style={[
                        styles.time,
                        isOwn ? styles.ownTime : styles.otherTime
                    ]}>
                        {new Date(message.sentAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>

                    {/* Чекмарки для своих сообщений */}
                    {isOwn && (
                        <View style={styles.readStatus}>
                            {showDoubleCheck ? (
                                <Text style={styles.doubleCheckmark}>✓✓</Text>
                            ) : (
                                <Text style={styles.singleCheckmark}>✓</Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        marginHorizontal: 16,
    },
    ownContainer: {
        alignItems: 'flex-end',
    },
    otherContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
    },
    ownBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: COLORS.gray[200],
        borderBottomLeftRadius: 4,
    },
    ownText: {
        fontSize: 16,
        color: COLORS.white,
    },
    otherText: {
        fontSize: 16,
        color: COLORS.gray[900],
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
    },
    time: {
        fontSize: 11,
    },
    ownTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherTime: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    readStatus: {
        marginLeft: 4,
    },
    singleCheckmark: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    doubleCheckmark: {
        fontSize: 12,
        color: COLORS.white,
        fontWeight: 'bold',
    },
});