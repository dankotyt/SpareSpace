// module.exports = function (api) {
//     api.cache(true);
//     return {
//         presets: ['babel-preset-expo'],
//         plugins: [
//             [
//                 'module-resolver',
//                 {
//                     root: ['./src'],
//                     alias: {
//                         '@': './src',
//                         '@/app': './src/app',
//                         '@/pages': './src/pages',
//                         '@/features': './src/features',
//                         '@/entities': './src/entities',
//                         '@/shared': './src/shared',
//                     },
//                 },
//             ],
//         ],
//     };
// };

module.exports = function(api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'react-native-reanimated/plugin',
        ]
    };
};