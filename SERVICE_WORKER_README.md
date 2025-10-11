# Service Worker Configuration

## Overview

The AUTO ANI website includes a Progressive Web App (PWA) Service Worker for offline functionality, caching, and app-like experience. The Service Worker is **disabled by default** to prevent potential issues with page loading.

## Enabling the Service Worker

To enable PWA features and the Service Worker:

1. Add to your `.env.local`:
   ```bash
   NEXT_PUBLIC_ENABLE_SW=true
   ```

2. Restart your development server

3. The Service Worker will register automatically

## What the Service Worker Does

When enabled, the Service Worker provides:

### 1. **Offline Support**
- Caches static assets (CSS, JS, images)
- Caches vehicle images for offline viewing
- Provides offline fallback pages
- Caches API responses for offline access

### 2. **Caching Strategies**

#### Cache-First (Images)
- Vehicle images are cached for 30 days
- Serves from cache if available
- Updates cache in background

#### Network-First (API)
- API calls try network first
- Falls back to cache if offline
- Cache refreshes on successful requests

#### Stale-While-Revalidate (Pages)
- Serves cached version immediately
- Updates cache in background
- Best for vehicle detail pages

### 3. **Background Sync**
- Stores form submissions when offline
- Syncs to server when connection restored
- Handles contact forms and other submissions

### 4. **Update Management**
- Checks for updates every 30 minutes
- Shows update prompt to users
- Allows manual update or dismiss

## Caching Configuration

### Static Assets Cached
- `/` (homepage)
- `/vehicles` (vehicle listing)
- `/contact` (contact page)
- `/services` (services page)
- `/offline` (offline fallback)
- `/manifest.json`
- `/favicon.ico`

### Dynamic Assets
- Vehicle images: 30 day cache
- API responses: 5 minute cache
- Vehicle pages: 24 hour cache

## Troubleshooting

### Service Worker Not Registering

**Check:**
1. Is `NEXT_PUBLIC_ENABLE_SW=true` set?
2. Is the app running on HTTPS or localhost?
3. Check browser console for errors

**Solution:**
```bash
# In .env.local
NEXT_PUBLIC_ENABLE_SW=true
```

### Pages Not Loading

If you experience page load issues:

1. **Disable Service Worker:**
   ```bash
   # Remove or set to false
   NEXT_PUBLIC_ENABLE_SW=false
   ```

2. **Unregister existing Service Worker:**
   - Open DevTools → Application → Service Workers
   - Click "Unregister" for the AUTO ANI worker
   - Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)

3. **Clear Cache:**
   - Open DevTools → Application → Storage
   - Click "Clear site data"
   - Refresh the page

### Cache Not Updating

**Manual Cache Clear:**
1. Open DevTools → Application → Cache Storage
2. Delete `auto-ani-static-v1.0.0` and `auto-ani-dynamic-v1.0.0`
3. Refresh the page

**Update Service Worker:**
1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Refresh the page

### Testing Offline

1. Enable Service Worker
2. Load the website fully
3. Open DevTools → Network
4. Select "Offline" from throttling dropdown
5. Navigate the site - cached pages should work

## Development

### Version Management

Update cache versions when deploying:

```javascript
// public/sw.js
const STATIC_CACHE = 'auto-ani-static-v1.0.1'; // Increment version
const DYNAMIC_CACHE = 'auto-ani-dynamic-v1.0.1';
```

### Testing Service Worker

```bash
# Build for production
npm run build

# Run production server
npm run start

# Service Worker only works in production mode
```

### Debugging

Enable verbose logging:

```javascript
// In sw.js, all console.log statements are preserved
// Check browser console for SW logs prefixed with [SW]
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Push Notifications | ✅ | ✅ | ✅ | ✅ |
| Cache API | ✅ | ✅ | ✅ | ✅ |

## Security Considerations

1. **HTTPS Required:** Service Workers only work on HTTPS (except localhost)
2. **Scope:** Service Worker is scoped to `/` (entire site)
3. **Update Strategy:** `updateViaCache: 'none'` ensures fresh SW code
4. **Origin Security:** Only same-origin requests are cached

## Production Checklist

Before enabling in production:

- [ ] Test all pages load correctly with SW enabled
- [ ] Test offline functionality
- [ ] Test form submissions (online and offline)
- [ ] Test update prompts work correctly
- [ ] Monitor error logs for SW issues
- [ ] Set up cache version management in CI/CD
- [ ] Configure cache expiration policies
- [ ] Test on all target browsers
- [ ] Document cache clear procedure for support team

## API Reference

### Custom Events

```javascript
// Trigger SW update from app code
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING'
  });
}
```

### Cache Specific Vehicle

```javascript
// Pre-cache a vehicle page
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_VEHICLE',
    url: '/api/vehicles/123'
  });
}
```

## Performance Impact

**With Service Worker Enabled:**
- First load: ~10-20ms overhead (SW registration)
- Subsequent loads: 50-90% faster (cache hits)
- Offline: Full functionality for cached pages
- Update checks: Every 30 minutes (minimal bandwidth)

**Storage Usage:**
- Static cache: ~2-5 MB
- Dynamic cache: ~10-50 MB (depends on browsing)
- Auto-cleanup: Keeps last 100 successful jobs

## Migration Guide

### From Disabled to Enabled

1. **Prepare:**
   ```bash
   # Add to production environment
   NEXT_PUBLIC_ENABLE_SW=true
   ```

2. **Deploy:**
   - Deploy new version with SW enabled
   - Monitor error logs closely

3. **Rollback if needed:**
   ```bash
   # Quick disable
   NEXT_PUBLIC_ENABLE_SW=false
   ```

### Force Unregister

If you need to force-unregister all Service Workers:

```javascript
// Add to app temporarily
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}
```

## Resources

- [Service Worker Spec](https://w3c.github.io/ServiceWorker/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox (Advanced SW)](https://developers.google.com/web/tools/workbox)
- [MDN Service Worker Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support

For Service Worker issues:
1. Check this documentation
2. Review browser console errors
3. Test with SW disabled
4. Check GitHub issues for similar problems
5. Create detailed bug report with:
   - Browser version
   - Steps to reproduce
   - Console errors
   - Network conditions
