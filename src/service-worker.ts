// src/service-worker.ts
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// 立即激活 Service Worker
clientsClaim();

// 预缓存所有在构建时生成的资源
precacheAndRoute(self.__WB_MANIFEST);

// 处理 SPA 的导航请求
registerRoute(
    // 返回 true 表示这是一个导航请求
    ({ request }) => request.mode === 'navigate',
    // 使用 NetworkFirst 策略
    new NetworkFirst({
        cacheName: 'pages',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
        ],
    })
);

// 缓存 CloudFlare Worker API 响应
registerRoute(
    ({ url }) => url.href.includes('workers.dev'),
    new StaleWhileRevalidate({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
        ],
    })
);

// 缓存静态资源
registerRoute(
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image',
    new CacheFirst({
        cacheName: 'static-resources',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
        ],
    })
);

// 处理离线页面
const pageHandler = createHandlerBoundToURL('/index.html');
registerRoute(
    ({ request }) => request.mode === 'navigate',
    ({ event }) => {
        return pageHandler(event as any);
    }
);