/* SmartBasa service worker — push + offline fallback only.
   Do not cache HTML or JS. Those caches were serving yesterday's design
   until a hard refresh. */
const CACHE = 'smart-living-shell-v2'
const OFFLINE_URL = '/offline'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([OFFLINE_URL]).catch(() => undefined)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Only intercept full page loads, and only to show the offline page when
  // the network is down. Online visits always use the live page.
  if (req.mode !== 'navigate') return

  event.respondWith(
    fetch(req).catch(() => caches.match(OFFLINE_URL)),
  )
})

self.addEventListener('push', event => {
  let payload = {
    title: 'SmartBasa',
    body: 'You have a new update.',
    url: '/',
    icon: '/icons/icon.svg',
    tag: 'smart-living',
  }
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch (err) {
    // keep defaults
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.icon,
      tag: payload.tag,
      data: { url: payload.url || '/' },
      vibrate: [120, 80, 120],
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
