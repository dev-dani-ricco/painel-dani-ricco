self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})
self.addEventListener("fetch", () => {
  // Network-first by design. Private panel/API responses are never cached.
})
