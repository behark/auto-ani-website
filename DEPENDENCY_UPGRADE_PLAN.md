# Dependency Upgrade Plan for Major Versions

This document outlines the major version updates that require manual testing and potentially breaking changes. DO NOT auto-update these without thorough testing.

## Overview

The following packages have major version updates available that include breaking changes. Each section below provides migration guidance and testing requirements.

---

## 1. React & React DOM (18.3.1 → 19.2.0)

**Current:** 18.3.1
**Latest:** 19.2.0
**Impact:** HIGH - Core framework update affecting entire application

### Breaking Changes
- Automatic batching changes
- New JSX Transform is now default
- Deprecated lifecycle methods removed
- Server Components changes
- Concurrent features enabled by default

### Migration Steps
1. Review React 19 changelog: https://react.dev/blog/2024/04/25/react-19
2. Update `@types/react` and `@types/react-dom` to v19
3. Test all components, especially class components
4. Verify Server Components behavior
5. Check for deprecated API usage
6. Test form handling changes (new Actions API)
7. Review all third-party React libraries for compatibility

### Testing Checklist
- [ ] All pages render correctly
- [ ] Forms submit properly
- [ ] Client components work as expected
- [ ] Server components function correctly
- [ ] No console warnings about deprecated APIs
- [ ] Third-party UI libraries (Radix UI, etc.) work correctly
- [ ] Animation libraries (framer-motion) work correctly

### Dependencies That May Need Updates
- `@types/react` → v19
- `@types/react-dom` → v19
- `next` (ensure Next.js supports React 19)
- All Radix UI components
- `framer-motion`
- `react-hook-form`
- `@tanstack/react-query`

---

## 2. @react-three/drei (9.122.0 → 10.7.6)

**Current:** 9.122.0
**Latest:** 10.7.6
**Impact:** MEDIUM - Used for 3D vehicle models

### Breaking Changes
- API changes in helper components
- Changes to camera controls
- Updates to shader materials
- Performance optimization changes

### Migration Steps
1. Review changelog: https://github.com/pmndrs/drei/releases
2. Update `@react-three/fiber` to v9 first
3. Test all 3D components
4. Review camera controls
5. Check shader implementations

### Testing Checklist
- [ ] 3D vehicle models render correctly
- [ ] Camera controls work properly
- [ ] Performance is acceptable
- [ ] No visual glitches
- [ ] Mobile rendering works

### Files to Test
- `/app/vehicles/[id]/page.tsx` (3D vehicle viewer)
- All components using Three.js

---

## 3. @react-three/fiber (8.18.0 → 9.3.0)

**Current:** 8.18.0
**Latest:** 9.3.0
**Impact:** MEDIUM - 3D rendering library

### Breaking Changes
- React 18+ required (prepare for React 19)
- API changes in hooks
- Event system updates
- Performance improvements with breaking changes

### Migration Steps
1. Review changelog: https://github.com/pmndrs/react-three-fiber/releases
2. Update after React upgrade
3. Test all 3D scenes
4. Review event handlers
5. Check performance

### Testing Checklist
- [ ] All 3D scenes render
- [ ] Event handling works (clicks, hovers)
- [ ] Performance is maintained
- [ ] No memory leaks
- [ ] Works on all browsers

---

## 4. Tailwind CSS (3.4.18 → 4.1.14)

**Current:** 3.4.18
**Latest:** 4.1.14
**Impact:** HIGH - Complete redesign, major breaking changes

### Breaking Changes
- Complete rewrite with new engine
- Configuration file format changes
- Plugin API changes
- Class name changes
- PostCSS configuration updates
- Content detection changes

### Migration Steps
1. **DO NOT UPGRADE YET** - Wait for ecosystem stability
2. Review official migration guide: https://tailwindcss.com/docs/upgrade-guide
3. Create a test branch
4. Update configuration files
5. Review all components for class name changes
6. Test all UI components
7. Verify all Radix UI + Tailwind integrations
8. Check all custom plugins

### Testing Checklist
- [ ] All pages style correctly
- [ ] Responsive design works
- [ ] Dark mode (if implemented) works
- [ ] All UI components render properly
- [ ] Custom Tailwind plugins work
- [ ] Build process completes successfully
- [ ] No style regressions

### Files to Update
- `tailwind.config.js` → `tailwind.config.ts` (new format)
- `postcss.config.js`
- All component files (potential class name changes)

### Recommended Approach
1. Wait for Tailwind CSS v4 to stabilize
2. Wait for all UI libraries to support v4
3. Allocate dedicated time for testing
4. Consider gradual migration using compatibility mode

---

## 5. Stripe (18.5.0 → 19.1.0)

**Current:** 18.5.0
**Latest:** 19.1.0
**Impact:** MEDIUM - Payment processing

### Breaking Changes
- API version updates
- Method signature changes
- Webhook handling updates
- Type definition changes

### Migration Steps
1. Review changelog: https://github.com/stripe/stripe-node/releases
2. Update Stripe API version in dashboard
3. Test all payment flows
4. Verify webhook handlers
5. Test subscription management
6. Check error handling

### Testing Checklist
- [ ] Payment creation works
- [ ] Payment capture works
- [ ] Refunds process correctly
- [ ] Webhooks receive events
- [ ] Subscription creation works
- [ ] Subscription updates work
- [ ] Error handling is correct
- [ ] All payment methods work

### Files to Test
- `/app/api/payments/*` (all payment API routes)
- `/lib/stripe.ts` (Stripe client configuration)
- All webhook handlers

---

## 6. @stripe/react-stripe-js (4.0.2 → 5.0.0)

**Current:** 4.0.2
**Latest:** 5.0.0
**Impact:** MEDIUM - Stripe UI components

### Breaking Changes
- Component API changes
- Hook updates
- TypeScript definitions

### Migration Steps
1. Update after main `stripe` package
2. Review changelog
3. Update `@stripe/stripe-js` to compatible version
4. Test all Stripe Elements
5. Verify form handling

### Testing Checklist
- [ ] Payment form renders
- [ ] Card element works
- [ ] Payment submission works
- [ ] Error display works
- [ ] Loading states work

### Note
- Currently pinned at `@stripe/stripe-js@7.9.0` due to peer dependency constraints
- Will need to update to compatible version when upgrading

---

## 7. Nodemailer (6.10.1 → 7.0.7)

**Current:** 6.10.1
**Latest:** 7.0.7
**Impact:** MEDIUM - Email sending

### Breaking Changes
- Transport configuration changes
- Authentication method updates
- API method changes
- Node.js version requirements

### Migration Steps
1. Review changelog: https://github.com/nodemailer/nodemailer/releases
2. Update email transport configuration
3. Test all email templates
4. Verify authentication
5. Test error handling

### Testing Checklist
- [ ] Email sending works
- [ ] Templates render correctly
- [ ] Attachments work
- [ ] Authentication succeeds
- [ ] Error handling works
- [ ] All email types send successfully

### Files to Test
- `/lib/email.ts` (email configuration)
- All email sending functions
- Email templates

---

## 8. bcryptjs (2.4.3 → 3.0.2)

**Current:** 2.4.3
**Latest:** 3.0.2
**Impact:** MEDIUM - Password hashing

### Breaking Changes
- API changes for hashing
- Performance improvements
- TypeScript definitions

### Migration Steps
1. Review changelog
2. Test password hashing
3. Verify password comparison
4. Test user registration
5. Test user login

### Testing Checklist
- [ ] New password hashing works
- [ ] Existing passwords still validate
- [ ] User registration works
- [ ] User login works
- [ ] No security regressions

### Critical Note
- Ensure backward compatibility with existing hashed passwords
- Test with existing user accounts

---

## 9. @types/node (20.19.19 → 24.7.0)

**Current:** 20.19.19
**Latest:** 24.7.0
**Impact:** LOW - Type definitions only

### Notes
- This is a type-only update
- May require Node.js runtime update
- Check for new Node.js features
- Verify all type definitions compile

### Migration Steps
1. Update types
2. Run type check: `npm run type-check`
3. Fix any type errors
4. Test build process

---

## 10. next-pwa (Removed)

**Status:** REMOVED - Package was not in use
**Previous Version:** 4.0.0-beta.0
**Latest:** 5.6.0

### Notes
- PWA functionality was disabled (commented out in `next.config.ts`)
- Service Worker was causing issues on vehicles page
- Package has been removed
- If PWA is needed in future, install `next-pwa@5.6.0` and configure properly

---

## Minor Version Updates to Monitor

These packages also have updates but are lower priority:

1. **@opentelemetry packages** - Monitoring and observability
2. **lucide-react** - Icon library (frequently updated)
3. **eslint-config-next** - Already updated to latest

---

## Upgrade Priority & Timeline

### Phase 1: Low Risk (Immediate)
- ✅ All patch/minor updates (COMPLETED)
- ✅ @types/node (type definitions only)

### Phase 2: Medium Risk (Within 1-2 months)
1. **Stripe packages** (18 → 19)
   - Test thoroughly in staging
   - Verify all payment flows
   - Update API version in Stripe dashboard

2. **Nodemailer** (6 → 7)
   - Test email sending
   - Verify templates

3. **bcryptjs** (2 → 3)
   - Critical: Test with existing passwords
   - Ensure backward compatibility

### Phase 3: High Risk (3-6 months)
1. **React 18 → 19**
   - Wait for Next.js official support confirmation
   - Wait for all third-party libraries to update
   - Allocate significant testing time
   - Test in isolated environment first

2. **@react-three packages** (after React update)
   - Update drei and fiber together
   - Thorough 3D testing

### Phase 4: Very High Risk (6-12 months)
1. **Tailwind CSS v4**
   - Wait for ecosystem maturity
   - Wait for all plugins and libraries to support v4
   - Plan for major refactoring time
   - Consider this a separate project

---

## Testing Strategy

### Before Each Major Update
1. Create a new branch
2. Run full test suite
3. Manual testing of affected features
4. Check browser console for errors
5. Review network requests
6. Test on multiple devices/browsers

### Staging Environment Testing
1. Deploy to staging
2. Full regression testing
3. Performance testing
4. Security audit
5. User acceptance testing

### Rollback Plan
1. Keep previous version in git history
2. Document rollback procedure
3. Monitor production after update
4. Have hotfix branch ready

---

## Dependencies Added

The following dependencies were added as part of this cleanup:

1. **dotenv** (^17.2.3) - Environment variable management
2. **sharp** (^0.34.4) - Image optimization
3. **web-vitals** (^5.1.0) - Performance monitoring
4. **@stripe/stripe-js** (7.9.0) - Stripe client library
5. **@sentry/nextjs** (^10.17.0) - Error monitoring
6. **googleapis** (^161.0.0) - Google APIs client
7. **@google-analytics/data** (^5.2.0) - Google Analytics data API
8. **glob** (^10.4.5) - File pattern matching

---

## Dependencies Removed

The following unused dependencies were removed:

1. **@types/dompurify** - Not needed (using isomorphic-dompurify)
2. **next-pwa** - PWA disabled, service worker causing issues
3. **react-window** - Custom implementation in virtual-list.tsx
4. **@types/react-window** - No longer needed
5. **workbox-webpack-plugin** - Not in use
6. **critters** - Not in use (optimizeCss disabled)
7. **tw-animate-css** - Not in use

---

## Current Status Summary

### ✅ Completed
- Added all missing dependencies
- Updated all patch/minor versions
- Removed unused dependencies
- Created comprehensive upgrade plan

### ⚠️ Pending Manual Action
- Major version updates require testing and planning
- Follow phased approach outlined above
- Monitor for security updates

### 🔒 Security Considerations
- 10 vulnerabilities detected (7 low, 2 moderate, 1 high)
- Run `npm audit` for details
- Consider running `npm audit fix` for non-breaking fixes
- Review each fix before applying

---

## Useful Commands

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update <package-name>

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities (non-breaking)
npm audit fix

# Fix vulnerabilities (including breaking)
npm audit fix --force

# Type check
npm run type-check

# Build test
npm run build
```

---

## Resources

- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/upgrade-guide)
- [Next.js Upgrade Guide](https://nextjs.org/docs/upgrading)
- [Stripe API Changelog](https://stripe.com/docs/upgrades)
- [Node.js Releases](https://nodejs.org/en/about/releases/)

---

**Last Updated:** 2025-10-07
**Next Review:** 2025-11-07
