export default {
    expo: {
        name: "SpareSpaceExpo",
        slug: "sparespace-expo",
        version: "1.0.0",
        orientation: "portrait",
        extra: {
            apiUrl: process.env.API_BASE_URL,
            environment: process.env.NODE_ENV || "development",
        },
    },
};