import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {FormattedUserProfile, UserProfile} from '@/types/profile';
import { COLORS } from '@/shared/constants/colors';

interface ProfileHeaderProps {
    profile: FormattedUserProfile;
    onReviewsPress: () => void;
    canEdit: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onReviewsPress, canEdit }) => {
    const getInitials = (name: string, surname: string, patronymic?: string) => {
        return `${name[0]}${surname[0]}`.toUpperCase();
    };

    const formatJoinDate = (createdAt: string) => {
        const date = new Date(createdAt);
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const safeRating = typeof profile.rating === 'number' ? profile.rating : 0;
    const safeReviewsCount = profile.stats?.totalReviews || 0;

    return (
        <View style={styles.container}>
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

            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.phone}>{profile.phone}</Text>

            <TouchableOpacity onPress={onReviewsPress}>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>{safeRating.toFixed(1)}</Text>
                    <Text style={styles.reviews}>({safeReviewsCount} отзывов)</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
        marginTop: 0,
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