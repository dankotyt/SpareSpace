import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BackButton } from '@components/ui/BackButton';
import { FormattedUserProfile } from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';

/**
 * Интерфейс пропсов заголовка профиля пользователя
 */
interface ProfileHeaderProps {
    profile: FormattedUserProfile;
    onReviewsPress: () => void;
    canEdit: boolean;
    isPublicProfile?: boolean;
    onBackPress?: () => void;
}

/**
 * React-компонент заголовка профиля с аватаром, именем и рейтингом
 * Поддерживает режимы публичного и личного профиля
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
                                                                profile,
                                                                onReviewsPress,
                                                                canEdit,
                                                                isPublicProfile = false,
                                                                onBackPress
                                                            }) => {
    /**
     * Генерирует инициалы пользователя для аватара
     * @param name - имя пользователя
     * @param surname - фамилия пользователя
     * @param patronymic - отчество пользователя (опционально)
     * @returns Строку с инициалами
     */
    const getInitials = (name: string, surname: string, patronymic?: string) => {
        return `${name[0]}${surname[0]}`.toUpperCase();
    };

    /**
     * Форматирует дату присоединения пользователя в читаемый формат
     * @param createdAt - строка с датой создания
     * @returns Локализованную дату на русском языке
     */
    const formatJoinDate = (createdAt: string) => {
        const date = new Date(createdAt);
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const safeRating = profile.rating;
    const safeReviewsCount = profile.stats?.totalReviews || 0;

    return (
        <View style={styles.container}>
            {/* Кнопка назад для публичного профиля */}
            {isPublicProfile && onBackPress && (
                <View style={styles.backButtonContainer}>
                    <BackButton
                        onPress={onBackPress}
                        backgroundColor={COLORS.transparent}
                    />
                </View>
            )}

            <View style={[
                styles.contentContainer,
                isPublicProfile && styles.publicProfileContent
            ]}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(profile.firstName, profile.lastName, profile.patronymic)}
                        </Text>
                    </View>
                    {profile.verified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.name}>
                    {profile.fullName}
                </Text>

                <Text style={styles.joinDate}>
                    Присоединился {formatJoinDate(profile.createdAt)}
                </Text>

                {profile.email && (
                    <Text style={styles.email}>{profile.email}</Text>
                )}

                {profile.phone && (
                    <Text style={styles.phone}>{profile.phone}</Text>
                )}

                <TouchableOpacity onPress={onReviewsPress}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.rating}>{safeRating}</Text>
                        <Text style={styles.reviews}>({safeReviewsCount} отзывов)</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    backButtonContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        alignItems: 'flex-start',
    },
    contentContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    publicProfileContent: {
        paddingTop: 0,
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.green[500],
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    verifiedText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    joinDate: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginBottom: 2,
    },
    phone: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginRight: 4,
    },
    reviews: {
        fontSize: 14,
        color: COLORS.gray[500],
    },
});