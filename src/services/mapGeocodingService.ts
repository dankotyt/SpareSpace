import {YANDEX_MAP_GEOCODER_CONFIG} from '@/config/mapConfig';

export interface GeocodingResult {
    address: string;
    latitude: number;
    longitude: number;
}

class GeocodingService {
    private baseUrl = 'https://geocode-maps.yandex.ru/v1';

    async reverseGeocode(location: { latitude: number; longitude: number }): Promise<string> {
        try {
            const response = await fetch(
                `${this.baseUrl}/?apikey=${YANDEX_MAP_GEOCODER_CONFIG.apiKey}&geocode=${location.longitude},${location.latitude}&format=json`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const featureMember = data.response.GeoObjectCollection.featureMember;

            if (featureMember.length > 0) {
                return featureMember[0].GeoObject.name;
            }

            return `Широта: ${location.latitude.toFixed(6)}, Долгота: ${location.longitude.toFixed(6)}`;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return `Широта: ${location.latitude.toFixed(6)}, Долгота: ${location.longitude.toFixed(6)}`;
        }
    }

    async geocode(address: string): Promise<GeocodingResult | null> {
        try {
            const response = await fetch(
                `${this.baseUrl}/?apikey=${YANDEX_MAP_GEOCODER_CONFIG.apiKey}&geocode=${encodeURIComponent(address)}&format=json`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const featureMember = data.response.GeoObjectCollection.featureMember;

            if (featureMember.length > 0) {
                const pos = featureMember[0].GeoObject.Point.pos.split(' ');
                return {
                    address: featureMember[0].GeoObject.name,
                    longitude: parseFloat(pos[0]),
                    latitude: parseFloat(pos[1])
                };
            }

            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }
}

export const geocodingService = new GeocodingService();