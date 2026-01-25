/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const ASSET_CACHE = "rpg-english-shell-assets";
const FONT_CACHE = "rpg-english-shell-fonts";
const IMAGE_CACHE = "rpg-english-shell-images";
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const SIXTY_DAYS = 60 * 60 * 24 * 60;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) {
        return (
          sameOrigin &&
          (request.destination === "script" || request.destination === "style")
        );
      },
      handler: new CacheFirst({
        cacheName: ASSET_CACHE,
        plugins: [
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: THIRTY_DAYS }),
        ],
      }),
    },
    {
      matcher({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) {
        return sameOrigin && request.destination === "font";
      },
      handler: new CacheFirst({
        cacheName: FONT_CACHE,
        plugins: [
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: THIRTY_DAYS }),
        ],
      }),
    },
    {
      matcher({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) {
        return sameOrigin && request.destination === "image";
      },
      handler: new StaleWhileRevalidate({
        cacheName: IMAGE_CACHE,
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: SIXTY_DAYS }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }: { request: Request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
