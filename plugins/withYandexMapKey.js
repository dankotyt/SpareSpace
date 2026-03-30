const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withYandexMapKey(config, { apiKey }) {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults;
        const application = androidManifest.manifest.application[0];

        const existingMetaData = application['meta-data'] || [];
        const alreadyHas = existingMetaData.some(
            (item) => item.$['android:name'] === 'com.yandex.maps.api.key'
        );

        if (!alreadyHas) {
            application['meta-data'] = [
                ...existingMetaData,
                {
                    $: {
                        'android:name': 'com.yandex.maps.api.key',
                        'android:value': apiKey,
                    },
                },
            ];
        }

        return config;
    });
};