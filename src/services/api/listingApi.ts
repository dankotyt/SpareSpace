import { tokenService } from '@/services/tokenService';

const API_BASE_URL = 'http://192.168.0.198:3000';

export interface CreateListingRequest {
    type: 'parking' | 'pantry' | 'garage';
    title: string;
    description?: string;
    price: number;
    price_period: 'hour' | 'day' | 'week' | 'month';
    currency: 'RUB';
    latitude?: number;
    longitude?: number;
    address: string;
    size?: number;
    photos_json?: string[];
    amenities?: any;
    availability?: Array<{
        start: string;
        end: string;
    }>;
}

export interface ListingResponse {
    id: number;
    type: string;
    title: string;
    description: string;
    price: number;
    price_period: string;
    currency: string;
    address: string;
    size?: number;
    photos_json: string[];
    amenities: any;
    availability: Array<{
        start: string;
        end: string;
    }>;
    user_id: number;
    status: string;
    created_at: string;
    updated_at: string;
}

class ListingApiService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = await tokenService.getToken();

        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    }

    async createListing(listingData: CreateListingRequest): Promise<ListingResponse> {
        return this.request<ListingResponse>('/listings', {
            method: 'POST',
            body: JSON.stringify(listingData),
        });
    }

    async getListings(): Promise<ListingResponse[]> {
        const response = await this.request<{ listings: ListingResponse[] }>('/listings');
        return response.listings || [];
    }

    async getUserListings(): Promise<ListingResponse[]> {
        const response = await this.request<{ listings: ListingResponse[] }>('/listings?my=true');
        return response.listings || [];
    }

    async getListingById(id: number): Promise<ListingResponse> {
        return this.request<ListingResponse>(`/listings/${id}`);
    }

    async updateListing(id: number, listingData: Partial<CreateListingRequest>): Promise<ListingResponse> {
        return this.request<ListingResponse>(`/listings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(listingData),
        });
    }

    async deleteListing(id: number): Promise<void> {
        await this.request(`/listings/${id}`, {
            method: 'DELETE',
        });
    }
}

export const listingApiService = new ListingApiService();