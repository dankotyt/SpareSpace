import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

export const YANDEX_MAP_CONFIG = {
    apiKey: extra?.yandexMapApiKey,
    geocoderApiKey: extra?.yandexMapGeocoderApiKey,
    locale: 'ru_RU',
    theme: 'light'
} as const;

export const YANDEX_MAP_GEOCODER_CONFIG = {
    apiKey: extra?.yandexMapGeocoderApiKey,
}