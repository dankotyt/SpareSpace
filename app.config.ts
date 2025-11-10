import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
    owner: "dankotyt",
    name: "SpareSpaceExpo",
    slug: "sparespace-expo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.sparespace"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        package: "com.sparespace"
    },
    extra: {
        apiUrl: process.env.API_BASE_URL,
        environment: process.env.NODE_ENV || "development",
        yandexMapGeocoderApiKey: process.env.YANDEX_MAP_GEOCODER_API_KEY,
        eas: {
            projectId: "4c21cb46-a8de-43b9-b346-f257b4459209"
        }
    },
};

export default config;