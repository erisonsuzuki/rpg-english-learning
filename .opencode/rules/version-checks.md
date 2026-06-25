# Version Checks

- Dispatch the `app:check-version` event after user actions that mutate story state or prompt-affecting settings. (Keeps `UpdateBanner` checks event-driven and avoids stale PWA sessions after meaningful interactions.)
