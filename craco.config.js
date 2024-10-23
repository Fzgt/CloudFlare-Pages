module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // 修改 GenerateSW 配置
            const workboxPlugin = webpackConfig.plugins.find(
                (plugin) => plugin.constructor.name === 'GenerateSW'
            );
            if (workboxPlugin) {
                Object.assign(workboxPlugin.config, {
                    skipWaiting: true,
                    clientsClaim: true,
                    cleanupOutdatedCaches: true,
                });
            }
            return webpackConfig;
        },
    },
};