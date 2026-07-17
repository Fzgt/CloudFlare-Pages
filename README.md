# CloudFlare Serverless — Offline-first PWA on the Edge

A hands-on demo of building a modern **Progressive Web App** end-to-end on Cloudflare's edge platform. A React frontend served from **Cloudflare Pages** talks to a serverless JSON endpoint on **Cloudflare Workers**, with a **Workbox-generated Service Worker** providing three-tier caching and full offline support.

Built to explore how far you can push "edge-only" architecture without a traditional backend server.

---

## Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        Browser                              │
  │                                                             │
  │   ┌──────────────────┐         ┌──────────────────────┐     │
  │   │  React SPA (CRA) │◄────────│  Service Worker      │     │
  │   │                  │         │  (Workbox-generated) │     │
  │   │  useEffect →     │         │                      │     │
  │   │  fetch()         │         │  ┌────────────────┐  │     │
  │   └────────┬─────────┘         │  │ pages          │  │     │
  │            │                   │  │  NetworkFirst  │  │     │
  │            │ (intercepted)     │  ├────────────────┤  │     │
  │            └──────────────────►│  │ api-cache      │  │     │
  │                                │  │  SWR           │  │     │
  │                                │  ├────────────────┤  │     │
  │                                │  │ static-        │  │     │
  │                                │  │  resources     │  │     │
  │                                │  │  CacheFirst    │  │     │
  │                                │  └────────────────┘  │     │
  │                                └──────────┬───────────┘     │
  │                                           │ (cache miss)    │
  └───────────────────────────────────────────┼─────────────────┘
                                              │
                                              ▼
              ┌─────────────────────────────────────────────┐
              │  Cloudflare Edge (300+ PoPs worldwide)      │
              │                                             │
              │  ┌───────────────────┐  ┌───────────────┐   │
              │  │ Cloudflare Pages  │  │ CF Workers    │   │
              │  │ (static assets)   │  │ data-api      │   │
              │  └───────────────────┘  └───────────────┘   │
              └─────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Tooling |
|---|---|
| **Frontend** | React 18, TypeScript, Create React App + CRACO |
| **Service Worker** | Workbox 7 (`precaching`, `routing`, `strategies`, `cacheable-response`) |
| **Serverless API** | Cloudflare Workers (TypeScript, ES2020) |
| **Worker Build** | esbuild (bundle + minify to a single ESM file) |
| **Worker Runtime** | V8 isolates on Cloudflare's edge (~30 ms cold start) |
| **Deployment** | Wrangler CLI (Workers), Cloudflare Pages (frontend) |
| **Testing** | Vitest with `@cloudflare/vitest-pool-workers` |

---

## Highlights

### 1. Three-tier caching strategy in the Service Worker
Different resource categories get different Workbox strategies (see [`my-worker-app/src/service-worker.ts`](my-worker-app/src/service-worker.ts)):

| Resource type | Strategy | Rationale |
|---|---|---|
| Navigation requests (`/`, SPA routes) | **NetworkFirst** | Prefer freshest HTML shell, fall back to cache when offline |
| API responses (`*.workers.dev`) | **StaleWhileRevalidate** | Return cached response instantly, refresh in background |
| Static assets (JS / CSS / images) | **CacheFirst** | Immutable hashed assets — cache is authoritative |

All three are guarded by `CacheableResponsePlugin({ statuses: [200] })` to avoid caching failed responses.

### 2. Instant SW takeover
Uses `clientsClaim()` + `skipWaiting: true` (via CRACO webpack tweak) so newly-installed Service Workers take control immediately on next load, without the standard "close all tabs" dance.

### 3. Offline-first UX with a fallback layer
- **First line of defense**: SW cache serves the last known-good API response
- **Second line of defense**: React app also persists the latest payload to `localStorage`, restoring it on cold start when both network and SW cache miss

### 4. Serverless API on Cloudflare Workers
The Worker (see [`my-worker/data-api/src/index.ts`](my-worker/data-api/src/index.ts)) is a plain `fetch` handler — no framework, no cold-start container, just a V8 isolate running at every edge PoP. Sets `Cache-Control: public, max-age=180` so Cloudflare's edge cache also participates in the cascade.

### 5. Edge-side + Client-side cache cooperation
Same 3-minute TTL is set on both the Worker response (`Cache-Control` header, honored by CF edge cache) and the client-side `setInterval` refresh, giving a coherent freshness contract across layers.

---

## Project Structure

```
CloudFlare-Serverless/
├── my-worker-app/            # React frontend (deployed to Cloudflare Pages)
│   ├── craco.config.js       # Webpack override to configure Workbox
│   ├── src/
│   │   ├── App.tsx           # Fetches from Worker, renders + persists to localStorage
│   │   ├── service-worker.ts # Workbox strategies (see Highlights §1)
│   │   └── serviceWorkerRegistration.ts  # SW lifecycle + update detection
│   └── package.json
│
└── my-worker/
    └── data-api/             # Cloudflare Worker (serverless API)
        ├── src/index.ts      # fetch handler → JSON response
        ├── wrangler.toml     # Worker config + esbuild bundle settings
        └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Cloudflare account (free tier is enough)
- Wrangler CLI: `npm install -g wrangler` then `wrangler login`

### Run the Worker locally
```bash
cd my-worker/data-api
npm install
npm run dev          # Wrangler dev server on http://localhost:8787
```

### Run the frontend locally
```bash
cd my-worker-app
npm install
npm start            # CRA dev server on http://localhost:3000
```

> The Service Worker is only registered in production builds (see `serviceWorkerRegistration.ts:14`). Run `npm run build && npx serve build` to see SW behavior locally.

### Deploy

```bash
# Deploy the Worker
cd my-worker/data-api
npm run deploy       # wrangler deploy → data-api.<your-subdomain>.workers.dev

# Deploy the frontend
cd my-worker-app
npm run build
# Then upload the build/ folder via Cloudflare Pages dashboard or wrangler pages deploy
```

Remember to update the API URL in `my-worker-app/src/App.tsx:19` to your deployed Worker URL.

