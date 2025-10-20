export interface AdItem {
    id: string;
    price: string;
    type: string;
    location: string;
    image?: string;
}

export interface CategoryItem {
    id: string;
    title: string;
    type: 'parking' | 'garage' | 'pantry' | 'other';
}