export interface AdItem {
    id: string;
    price: string;
    type: string;
    location: string;
    image?: string;
    originalData?: any;
}

export interface CategoryItem {
    id: string;
    title: string;
    type: 'PARKING' | 'GARAGE' | 'STORAGE' | 'OTHER' | 'ALL';
}