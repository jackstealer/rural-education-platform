const CACHE_NAME = 'rural-education-platform-v1.0.0';
const DATA_CACHE_NAME = 'rural-education-data-v1.0.0';

// Files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/auth.css',
  '/assets/css/dashboard.css',
  '/assets/css/games.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/api.js',
  '/assets/js/offline.js',
  '/assets/js/i18n.js',
  '/assets/js/games.js',
  '/student/dashboard.html',
  '/student/subjects.html',
  '/student/profile.html',
  '/teacher/dashboard.html',
  '/teacher/analytics.html',
  '/teacher/students.html',
  '/games/physics/projectile-motion.html',
  '/games/physics/circuit-builder.html',
  '/games/chemistry/periodic-table-explorer.html',
  '/games/chemistry/virtual-lab.html',
  '/games/math/number-puzzles.html',
  '/games/math/geometry-visualizer.html',
  '/games/biology/cell-explorer.html',
  '/games/biology/ecosystem-simulation.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/games',
  '/api/students/subjects',
  '/api/students/achievements'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // If the request was successful, clone the response and store it in the cache
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If the network request failed, try to get it from the cache
            return cache.match(request);
          });
      })
    );
    return;
  }
  
  // Handle all other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Try to fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline data submission
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event.tag);
  
  if (event.tag === 'background-sync-progress') {
    event.waitUntil(syncProgressData());
  } else if (event.tag === 'background-sync-scores') {
    event.waitUntil(syncGameScores());
  }
});

// Push notifications for achievements
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New achievement unlocked!',
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Achievement',
        icon: '/assets/images/trophy-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Rural Education Platform', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/#achievements')
    );
  }
});

// Sync offline progress data
async function syncProgressData() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['offline_progress'], 'readwrite');
    const store = tx.objectStore('offline_progress');
    const offlineData = await store.getAll();
    
    for (const data of offlineData) {
      try {
        const response = await fetch('/api/students/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          },
          body: JSON.stringify(data.progressData)
        });
        
        if (response.ok) {
          await store.delete(data.id);
        }
      } catch (error) {
        console.error('Failed to sync progress data:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing progress data:', error);
  }
}

// Sync offline game scores
async function syncGameScores() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['offline_scores'], 'readwrite');
    const store = tx.objectStore('offline_scores');
    const offlineScores = await store.getAll();
    
    for (const score of offlineScores) {
      try {
        const response = await fetch(`/api/games/${score.subject}/${score.gameId}/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${score.token}`
          },
          body: JSON.stringify(score.scoreData)
        });
        
        if (response.ok) {
          await store.delete(score.id);
        }
      } catch (error) {
        console.error('Failed to sync game score:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing game scores:', error);
  }
}

// IndexedDB helper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RuralEducationDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline_progress')) {
        const progressStore = db.createObjectStore('offline_progress', { keyPath: 'id', autoIncrement: true });
        progressStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('offline_scores')) {
        const scoresStore = db.createObjectStore('offline_scores', { keyPath: 'id', autoIncrement: true });
        scoresStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('user_data')) {
        const userStore = db.createObjectStore('user_data', { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains('content_cache')) {
        const contentStore = db.createObjectStore('content_cache', { keyPath: 'url' });
        contentStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});