import { UserProfile, UserAsset } from '@/entities/user/model/types';

export const profileApi = {
    async getUserProfile(): Promise<UserProfile> {
        // Здесь будет реальный API call
        // const response = await apiClient.get('/profile');
        // return response.data;

        // Временная заглушка
        return {
            id: '1',
            name: 'Ethan Carter',
            joinYear: 2021,
            rating: 4.8,
            reviewsCount: 12,
            balance: 12500,
        };
    },

    async getUserAssets(): Promise<UserAsset[]> {
        // Здесь будет реальный API call
        return [
            {
                id: '1',
                title: 'Парковочное место',
                address: 'Зеленоград-Крюково',
                type: 'parking'
            },
            {
                id: '2',
                title: 'Кладовое помещение',
                address: 'Новокузнецкая',
                type: 'pantry'
            }
        ];
    },

    async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
        // Реальный API call для обновления профиля
        // const response = await apiClient.put('/profile', profile);
        // return response.data;
        return { ...profile } as UserProfile;
    }
};