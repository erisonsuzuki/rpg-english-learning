const CACHE_PREFIXES = ["rpg-english-shell-", "serwist", "workbox-precache"];

export async function clearAppCaches() {
  const root = globalThis as typeof globalThis & {
    caches?: CacheStorage;
  };
  if (!root.caches) return;
  const keys = await root.caches.keys();
  const targets = keys.filter((key) =>
    CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
  await Promise.all(targets.map((key) => root.caches?.delete(key)));
}

export function waitForInstalled(installing: ServiceWorker | null | undefined) {
  return new Promise<ServiceWorker | null>((resolve) => {
    if (!installing) {
      resolve(null);
      return;
    }
    if (installing.state === "installed") {
      resolve(installing);
      return;
    }
    const handler = () => {
      if (installing.state === "installed") {
        installing.removeEventListener("statechange", handler);
        resolve(installing);
      }
    };
    installing.addEventListener("statechange", handler);
  });
}
