import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

export const YANDEX_MAP_CONFIG = {
    apiKey: extra?.yandexMapGeocoderApiKey || process.env.YANDEX_MAP_GEOCODER_API_KEY,
    locale: 'ru_RU',
    theme: 'light'
} as const;