export default {
    expo: {
        owner: "dankotyt",
        name: "SpareSpaceExpo",
        slug: "sparespace",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: false,
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
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            apiUrl: process.env.API_BASE_URL,
            environment: process.env.NODE_ENV || "development",
            yandexMapApiKey: process.env.YANDEX_MAP_API_KEY,
            yandexMapGeocoderApiKey: process.env.YANDEX_MAP_GEOCODER_API_KEY,
            eas: {
                projectId: "9fe560bc-8e46-4abe-bae8-68a9aa65847f"
            }
        },
        plugins: [
            [
                "expo-build-properties",
                { android: { minSdkVersion: 26, targetSdkVersion: 34, usesCleartextTraffic: true } },
            ],
            [
                "./plugins/withYandexMapKey.js",
                { apiKey: process.env.YANDEX_MAP_API_KEY }
            ]
        ]
    }
};