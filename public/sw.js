// AUTO ANI Service Worker - Enhanced Offline Functionality & PWA Features
const VERSION = '2.0.0';
const CACHE_NAME = `auto-ani-v${VERSION}`;
const STATIC_CACHE = `auto-ani-static-v${VERSION}`;
const DYNAMIC_CACHE = `auto-ani-dynamic-v${VERSION}`;
const IMAGES_CACHE = `auto-ani-images-v${VERSION}`;
const API_CACHE = `auto-ani-api-v${VERSION}`;

// Cache size limits
const CACHE_LIMITS = {
  DYNAMIC: 50,    // Max 50 dynamic pages
  IMAGES: 100,    // Max 100 images
  API: 30         // Max 30 API responses
};

// Critical assets to cache immediately for offline functionality
const STATIC_ASSETS = [
  '/',
  '/vehicles',
  '/contact',
  '/services',
  '/about',
  '/financing',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Critical pages that should work offline
const CRITICAL_PAGES = [
  '/',
  '/vehicles',
  '/contact',
  '/offline'
];

// Essential API endpoints to cache
const ESSENTIAL_APIS = [
  '/api/vehicles/featured',
  '/api/vehicles/count',
  '/api/config/business-info'
];

// Enhanced caching strategies with performance optimizations
const CACHE_STRATEGIES = {
  // Static assets - cache first with long TTL
  static: {
    patterns: [/\/_next\/static\//, /\.(?:js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/],
    strategy: 'cache-first',
    cacheName: STATIC_CACHE,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 200
  },

  // Vehicle images - cache first with size limits
  images: {
    patterns: [/\/images\//, /\/uploads\//, /cloudinary\.com/],
    strategy: 'cache-first',
    cacheName: IMAGES_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: CACHE_LIMITS.IMAGES
  },

  // API calls - network first with offline fallback
  api: {
    patterns: [/\/api\//],
    strategy: 'network-first',
    cacheName: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: CACHE_LIMITS.API,
    networkTimeoutSeconds: 3
  },

  // Vehicle pages - stale while revalidate for better UX
  pages: {
    patterns: [/\/vehicles\//, /\/services\//, /\/about/, /\/financing/],
    strategy: 'stale-while-revalidate',
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: CACHE_LIMITS.DYNAMIC
  },

  // Google Fonts - cache with custom strategy
  fonts: {
    patterns: [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/],
    strategy: 'stale-while-revalidate',
    cacheName: STATIC_CACHE,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 30
  }
};

// Install event - comprehensive asset precaching
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${VERSION}...`);

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('[SW] Some static assets failed to cache:', error);
          // Try to cache individual assets that succeed
          return Promise.allSettled(
            STATIC_ASSETS.map(asset => cache.add(asset))
          );
        });
      }),

      // Pre-cache essential API responses
      caches.open(API_CACHE).then(async (cache) => {
        console.log('[SW] Pre-caching essential APIs');
        const apiPromises = ESSENTIAL_APIS.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const responseClone = response.clone();
              const responseWithDate = new Response(await responseClone.text(), {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  ...Object.fromEntries(response.headers.entries()),
                  'sw-cache-date': new Date().toISOString(),
                  'sw-precached': 'true'
                }
              });
              return cache.put(endpoint, responseWithDate);
            }
          } catch (error) {
            console.warn(`[SW] Failed to pre-cache API ${endpoint}:`, error);
          }
        });

        return Promise.allSettled(apiPromises);
      }),

      // Pre-cache offline fallback pages
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Pre-caching critical pages');
        return Promise.allSettled(
          CRITICAL_PAGES.map(page => {
            return fetch(page).then(response => {
              if (response.ok) {
                return cache.put(page, response);
              }
            }).catch(error => {
              console.warn(`[SW] Failed to pre-cache page ${page}:`, error);
            });
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Installation completed successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
      // Still try to activate
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${VERSION}...`);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGES_CACHE, API_CACHE];
        const deletePromises = cacheNames
          .filter(cacheName => !validCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      }),

      // Limit cache sizes to prevent storage bloat
      limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS.DYNAMIC),
      limitCacheSize(IMAGES_CACHE, CACHE_LIMITS.IMAGES),
      limitCacheSize(API_CACHE, CACHE_LIMITS.API),

      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation completed successfully');

      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: VERSION,
            caches: [STATIC_CACHE, DYNAMIC_CACHE, IMAGES_CACHE, API_CACHE]
          });
        });
      });
    }).catch((error) => {
      console.error('[SW] Activation failed:', error);
    })
  );
});

// Enhanced fetch event with sophisticated routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests except for POST to specific endpoints
  if (request.method !== 'GET' &&
      !(request.method === 'POST' && url.pathname.includes('/api/contact'))) {
    return;
  }

  // Handle cross-origin requests (fonts, CDNs, etc.)
  if (url.origin !== location.origin) {
    // Handle Google Fonts and other essential cross-origin resources
    for (const [strategyName, strategy] of Object.entries(CACHE_STRATEGIES)) {
      if (strategy.patterns && strategy.patterns.some(pattern => pattern.test(url.href))) {
        event.respondWith(handleRequestWithStrategy(request, strategy));
        return;
      }
    }
    return; // Skip other cross-origin requests
  }

  // Route requests to appropriate handlers based on patterns
  for (const [strategyName, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (strategy.patterns && strategy.patterns.some(pattern => pattern.test(url.pathname))) {
      event.respondWith(handleRequestWithStrategy(request, strategy));
      return;
    }
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default handler for unmatched requests
  event.respondWith(handleDefaultRequest(request));
});

// Universal request handler with strategy pattern
async function handleRequestWithStrategy(request, strategy) {
  const { strategy: strategyType, cacheName, maxAge, maxEntries, networkTimeoutSeconds } = strategy;

  try {
    switch (strategyType) {
      case 'cache-first':
        return await cacheFirstStrategy(request, cacheName, maxAge, maxEntries);

      case 'network-first':
        return await networkFirstStrategy(request, cacheName, maxAge, maxEntries, networkTimeoutSeconds);

      case 'stale-while-revalidate':
        return await staleWhileRevalidateStrategy(request, cacheName, maxAge, maxEntries);

      default:
        console.warn('[SW] Unknown strategy:', strategyType);
        return await networkFirstStrategy(request, cacheName, maxAge, maxEntries);
    }
  } catch (error) {
    console.error('[SW] Strategy handler failed:', error);
    return await handleOfflineRequest(request);
  }
}

// Cache-first strategy implementation
async function cacheFirstStrategy(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && await isResponseFresh(cachedResponse, maxAge)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = await createCacheableResponse(networkResponse.clone());
      await cache.put(request, responseToCache.clone());
      await limitCacheSize(cacheName, maxEntries);
      return responseToCache;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.warn('[SW] Network failed, using stale cache:', error);
    return cachedResponse || createOfflineResponse('Resource not available offline');
  }
}

// Network-first strategy implementation
async function networkFirstStrategy(request, cacheName, maxAge, maxEntries, timeoutSeconds = 3) {
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeoutSeconds * 1000);
    });

    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = await createCacheableResponse(networkResponse.clone());
      await cache.put(request, responseToCache.clone());
      await limitCacheSize(cacheName, maxEntries);
      return responseToCache;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return addOfflineHeaders(cachedResponse);
    }

    return createOfflineResponse('Resource not available offline');
  }
}

// Stale-while-revalidate strategy implementation
async function staleWhileRevalidateStrategy(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Return cached response immediately if available
  if (cachedResponse) {
    // Update cache in background without blocking response
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const responseToCache = await createCacheableResponse(networkResponse);
          await cache.put(request, responseToCache);
          await limitCacheSize(cacheName, maxEntries);
        }
      })
      .catch((error) => {
        console.warn('[SW] Background revalidation failed:', error);
      });

    return cachedResponse;
  }

  // No cached version, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = await createCacheableResponse(networkResponse.clone());
      await cache.put(request, responseToCache.clone());
      await limitCacheSize(cacheName, maxEntries);
      return responseToCache;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    return createOfflineResponse('Resource not available offline');
  }
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    const url = new URL(request.url);

    // Try network first for navigation requests
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(DYNAMIC_CACHE);
      const responseToCache = await createCacheableResponse(networkResponse.clone());
      await cache.put(request, responseToCache.clone());
      await limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS.DYNAMIC);
      return responseToCache;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.warn('[SW] Navigation request failed, trying cache:', error);

    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return addOfflineHeaders(cachedResponse);
    }

    // Fallback to offline page
    const staticCache = await caches.open(STATIC_CACHE);
    const offlinePage = await staticCache.match('/offline');
    return offlinePage || createOfflineResponse('Page not available offline');
  }
}

// Default handler for unmatched requests
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    return createOfflineResponse('Resource not available offline');
  }
}

// Handle offline-specific requests
async function handleOfflineRequest(request) {
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline');
    return offlinePage || createOfflineResponse('Page not available offline');
  }

  return createOfflineResponse('Resource not available offline');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Create cacheable response with timestamp
async function createCacheableResponse(response) {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cache-date': new Date().toISOString(),
      'sw-cached': 'true'
    }
  });
}

// Check if cached response is still fresh
async function isResponseFresh(response, maxAge) {
  if (!maxAge) return true;

  const cacheDate = response.headers.get('sw-cache-date');
  if (!cacheDate) return false;

  const age = Date.now() - new Date(cacheDate).getTime();
  return age < maxAge;
}

// Add offline headers to cached responses
async function addOfflineHeaders(response) {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'x-served-by': 'service-worker-cache',
      'x-offline': 'true'
    }
  });
}

// Limit cache size to prevent storage bloat
async function limitCacheSize(cacheName, maxSize) {
  if (!maxSize || maxSize <= 0) return;

  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
      // Remove oldest entries (FIFO)
      const keysToDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));

      console.log(`[SW] Cleaned ${keysToDelete.length} entries from ${cacheName}`);
    }
  } catch (error) {
    console.error(`[SW] Failed to limit cache size for ${cacheName}:`, error);
  }
}

// Create offline response for different request types
function createOfflineResponse(message) {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message,
      offline: true,
      timestamp: new Date().toISOString(),
      retryAfter: 30 // Suggest retry after 30 seconds
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'x-served-by': 'service-worker-offline',
        'Cache-Control': 'no-cache',
        'Retry-After': '30'
      }
    }
  );
}

// Create structured offline API responses
function createOfflineApiResponse(url) {
  const urlPath = new URL(url).pathname;

  // Vehicle-specific offline responses
  if (urlPath.includes('/api/vehicles')) {
    const responseData = {
      vehicles: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
      offline: true,
      message: 'Vehicle data is not available offline. Please check your internet connection to see the latest inventory.',
      cacheInfo: {
        lastUpdate: null,
        nextUpdate: 'When online'
      }
    };

    return new Response(JSON.stringify(responseData), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'x-served-by': 'service-worker-offline',
        'x-api-type': 'vehicles',
        'Cache-Control': 'no-cache'
      }
    });
  }

  // Contact form offline response
  if (urlPath.includes('/api/contact')) {
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        message: 'Your message cannot be sent while offline. It will be queued and sent when your connection is restored.',
        queued: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'x-served-by': 'service-worker-offline',
          'x-api-type': 'contact'
        }
      }
    );
  }

  // Generic API offline response
  return createOfflineResponse('API service not available offline');
}

// Enhanced message handling from the app
self.addEventListener('message', (event) => {
  const { data } = event;

  if (!data || !data.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_VEHICLE':
      // Pre-cache specific vehicle data
      handleVehicleCacheRequest(data.url);
      break;

    case 'CACHE_URLS':
      // Batch cache multiple URLs
      handleBatchCacheRequest(data.urls);
      break;

    case 'GET_CACHE_STATUS':
      // Return cache status information
      handleCacheStatusRequest(event);
      break;

    case 'CLEAR_CACHE':
      // Clear specific cache or all caches
      handleClearCacheRequest(data.cacheName);
      break;

    case 'PRELOAD_CRITICAL':
      // Preload critical resources
      handlePreloadCriticalRequest();
      break;

    default:
      console.log('[SW] Unknown message type:', data.type);
  }
});

// Handle vehicle cache requests
async function handleVehicleCacheRequest(url) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.add(url);
    console.log('[SW] Vehicle pre-cached:', url);
  } catch (error) {
    console.error('[SW] Failed to pre-cache vehicle:', error);
  }
}

// Handle batch cache requests
async function handleBatchCacheRequest(urls) {
  if (!Array.isArray(urls)) return;

  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const results = await Promise.allSettled(
      urls.map(url => cache.add(url))
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[SW] Batch cached ${successes}/${urls.length} URLs`);
  } catch (error) {
    console.error('[SW] Batch cache failed:', error);
  }
}

// Handle cache status requests
async function handleCacheStatusRequest(event) {
  try {
    const cacheNames = await caches.keys();
    const cacheStatus = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheStatus[cacheName] = {
        count: keys.length,
        size: await estimateCacheSize(cache, keys)
      };
    }

    event.ports[0]?.postMessage({
      type: 'CACHE_STATUS_RESPONSE',
      status: cacheStatus,
      version: VERSION
    });
  } catch (error) {
    console.error('[SW] Failed to get cache status:', error);
  }
}

// Handle cache clearing requests
async function handleClearCacheRequest(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('[SW] Cache cleared:', cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SW] All caches cleared');
    }
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}

// Handle preload critical resources
async function handlePreloadCriticalRequest() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(
      STATIC_ASSETS.map(asset => cache.add(asset))
    );
    console.log('[SW] Critical resources preloaded');
  } catch (error) {
    console.error('[SW] Failed to preload critical resources:', error);
  }
}

// Estimate cache size
async function estimateCacheSize(cache, keys) {
  let totalSize = 0;
  const sampleSize = Math.min(keys.length, 10); // Sample first 10 entries

  for (let i = 0; i < sampleSize; i++) {
    try {
      const response = await cache.match(keys[i]);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    } catch (error) {
      // Skip failed entries
    }
  }

  // Estimate total size based on sample
  return Math.round((totalSize / sampleSize) * keys.length);
}

// Background sync for form submissions (when network is restored)
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
});

async function syncContactForms() {
  try {
    // Get stored form submissions from IndexedDB
    const db = await openFormDB();
    const submissions = await getStoredSubmissions(db);

    for (const submission of submissions) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data)
        });

        if (response.ok) {
          await removeStoredSubmission(db, submission.id);
          console.log('[SW] Contact form synced successfully');
        }
      } catch (error) {
        console.error('[SW] Failed to sync form submission:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers for offline form storage
function openFormDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AutoAniOfflineForms', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getStoredSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['submissions'], 'readonly');
    const store = transaction.objectStore('submissions');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeStoredSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Performance monitoring
self.addEventListener('install', () => {
  console.log(`[SW] Enhanced Service Worker v${VERSION} loaded successfully`);
});

// Notify about updates
console.log(`[SW] AUTO ANI Enhanced Service Worker v${VERSION} initialized with:
- Multi-strategy caching (cache-first, network-first, stale-while-revalidate)
- Performance optimizations with cache size limits
- Enhanced offline support with structured responses
- Background sync for form submissions
- Comprehensive error handling and fallbacks
- Real-time cache management and monitoring`);