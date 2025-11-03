import { tokenService } from '@/services/tokenService';
import { API_BASE_URL } from '@/config/env';

export interface CreateListingRequest {
    type: 'PARKING' | 'STORAGE' | 'GARAGE';
    title: string;
    description?: string;
    price: number;
    pricePeriod: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
    currency: 'RUB';
    latitude?: number;
    longitude?: number;
    address: string;
    size?: number;
    photosJson?: string[];
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
    pricePeriod: string;
    currency: string;
    address: string;
    size?: number;
    photosJson: string[];
    amenities: any;
    availability: Array<{
        start: string;
        end: string;
    }>;
    userId: number;
    status: string;
    createdAt: string;
    updatedAt: string;
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