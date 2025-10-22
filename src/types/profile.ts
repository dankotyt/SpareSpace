export interface UserProfile {
    id: string;
    name: string;
    joinYear: number;
    rating: number;
    reviewsCount: number;
    balance: number;
}

export interface UserAsset {
    id: string;
    title: string;
    address: string;
    type: 'parking' | 'garage' | 'pantry' | 'other';
}