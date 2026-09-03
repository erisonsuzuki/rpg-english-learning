export type BrowserRuntime = typeof globalThis & {
  setTimeout?: (handler: () => void, timeout?: number) => number;
  clearTimeout?: (timeoutId: number) => void;
  setInterval?: (handler: () => void, timeout?: number) => number;
  clearInterval?: (intervalId: number) => void;
  addEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject
  ) => void;
  removeEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject
  ) => void;
  dispatchEvent?: (event: Event) => void;
  location?: { origin?: string; reload?: () => void; assign?: (url: string) => void; hash?: string; pathname?: string; search?: string };
  history?: { replaceState?: (data: unknown, unused: string, url?: string | URL | null) => void };
  document?: {
    visibilityState?: DocumentVisibilityState;
    documentElement?: { dataset?: { theme?: string } };
    addEventListener?: (
      type: string,
      listener: EventListenerOrEventListenerObject
    ) => void;
    removeEventListener?: (
      type: string,
      listener: EventListenerOrEventListenerObject
    ) => void;
  };
  navigator?: {
    serviceWorker?: ServiceWorkerContainer;
  };
};

export function getBrowserRuntime(): BrowserRuntime {
  return globalThis as BrowserRuntime;
}
