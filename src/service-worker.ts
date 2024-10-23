import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// 预缓存所有静态资源
precacheAndRoute(self.__WB_MANIFEST);

// 缓存 API 请求
registerRoute(
    ({ url }) => url.href.includes('workers.dev'),
    new StaleWhileRevalidate({
        cacheName: 'api-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 300, // 5分钟
            }),
        ],
    })
);

// 缓存静态资源
registerRoute(
    ({ request }) => request.destination === 'image' ||
        request.destination === 'script' ||
        request.destination === 'style',
    new CacheFirst({
        cacheName: 'static-resources',
    })
);

// self.addEventListener('install', (event) => {
//     self.skipWaiting();
// });