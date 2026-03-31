const { withMainApplication } = require('expo/config-plugins');

module.exports = function withFirebasePackages(config) {
    return withMainApplication(config, (config) => {
        let content = config.modResults.contents;

        // Добавляем импорты, если их нет
        if (!content.includes('import io.invertase.firebase.app.ReactNativeFirebaseAppPackage')) {
            content = content.replace(
                /package com\.spare_space/,
                `package com.spare_space\n\nimport io.invertase.firebase.app.ReactNativeFirebaseAppPackage\nimport io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage`
            );
        }

        // Находим метод getPackages() и добавляем пакеты, если их нет
        const packagesPattern = /override fun getPackages\(\): List<ReactPackage>[\s=]+(.+)/;
        const match = content.match(packagesPattern);

        if (match && !content.includes('ReactNativeFirebaseAppPackage()')) {
            const oldLine = match[1];
            // Заменяем однострочную версию на многострочную
            if (oldLine.includes('PackageList(this).packages')) {
                const newCode = `override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages
        packages.add(ReactNativeFirebaseAppPackage())
        packages.add(ReactNativeFirebaseMessagingPackage())
        return packages
    }`;
                content = content.replace(match[0], newCode);
            }
        }

        config.modResults.contents = content;
        return config;
    });
};