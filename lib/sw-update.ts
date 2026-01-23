const CACHE_PREFIX = "rpg-english-shell-";

export async function clearAppCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  const targets = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  await Promise.all(targets.map((key) => caches.delete(key)));
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
