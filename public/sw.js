// Service Worker for Queensland Youth Justice Tracker
const CACHE_NAME = 'qld-youth-justice-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/action',
  '/offline.html',
  '/manifest.json'
];

// Critical data to cache
const DATA_CACHE_NAME = 'qld-youth-justice-data-v2';
const dataUrlsToCache = [
  '/api/dashboard',
  '/api/sources'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      }),
      caches.open(DATA_CACHE_NAME).then(cache => {
        return cache.addAll(dataUrlsToCache);
      })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(DATA_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle other requests
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      // Clone the request
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest).then(response => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // If both network and cache fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Background sync for sharing when back online
self.addEventListener('sync', event => {
  if (event.tag === 'share-stats') {
    event.waitUntil(shareQueuedStats());
  }
});

async function shareQueuedStats() {
  // Get queued shares from IndexedDB
  // Send them when back online
  console.log('Syncing queued shares...');
}