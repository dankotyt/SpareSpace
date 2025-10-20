import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserProfile } from '@/entities/user/model/types';
import { COLORS } from '@/shared/constants/colors';

interface ProfileHeaderProps {
    profile: UserProfile;
    onReviewsPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onReviewsPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                </View>
            </View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.joinDate}>Присоединился в {profile.joinYear}</Text>
            <TouchableOpacity onPress={onReviewsPress}>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>{profile.rating}</Text>
                    <Text style={styles.reviews}>({profile.reviewsCount} отзывов)</Text>
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
        marginTop: 50,
    },
    avatarContainer: {
        marginBottom: 16,
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
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    joinDate: {
        fontSize: 16,
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